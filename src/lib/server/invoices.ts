import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { invoices } from '@wix/get-paid';

import { APP_ID } from '../entitlement';
import { QUOTE_REQUESTS_COLLECTION_ID } from '../listing-types';
import {
  draftFromQuoteRequest,
  parseInvoiceDraft,
  statusesForFilter,
  summarizeWixInvoice,
  toWixInvoice,
  type InvoiceDraftErrors,
  type InvoiceDraftInput,
  type InvoiceFilter,
  type InvoiceRecord,
} from '../invoice-draft';
import { getAppEntitlement } from './entitlement';
import { getListing } from './listings';
import { getContactOption } from './contacts';
import { normalizeQuoteRequest, upsertQuoteContact } from './quote-requests';

/*
 * Wix Get Paid Invoices is the only source of truth: nothing is stored locally.
 * Invoices this app creates carry `sourceReference.appId` (used to list only them),
 * the quote request ID as `externalReferenceId`, and listing details as `externalProperties`.
 */

export class InvoiceError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly errors?: InvoiceDraftErrors) {
    super(message);
    this.name = 'InvoiceError';
  }
}

export interface CreatedInvoice {
  invoice: InvoiceRecord;
  /** Online payment (checkout) link, when Wix created one. */
  checkoutUrl?: string;
  /** Set when a step after creation (publish, send, payment link) failed. */
  warning?: string;
}

type Loose = Record<string, unknown>;
const record = (value: unknown): Loose => (typeof value === 'object' && value !== null ? value as Loose : {});
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** HTTP status of a Wix SDK error, wherever the SDK put it. */
function statusOf(error: unknown): number | undefined {
  const value = record(error);
  const details = record(value.details);
  const response = record(value.response);
  for (const candidate of [value.status, value.httpStatus, response.status, details.httpStatus]) {
    if (typeof candidate === 'number') return candidate;
  }
  const match = /\b(4\d\d|5\d\d)\b/.exec(String(value.message ?? ''));
  return match ? Number(match[1]) : undefined;
}

/** Maps a Wix Invoices API failure to an error the dashboard can explain. */
function toInvoiceError(error: unknown, fallback: string): InvoiceError {
  if (error instanceof InvoiceError) return error;
  const status = statusOf(error);
  if (status === 428) {
    return new InvoiceError('Wix Invoices isn’t available on this site yet. Wix is enabling it for existing sites gradually; please try again later.', 409, 'invoices_unavailable');
  }
  if (status === 401 || status === 403) {
    return new InvoiceError('The app doesn’t have permission to manage invoices on this site. Reinstall or update the app to grant the “Manage Invoices” permission.', 403, 'permission_missing');
  }
  if (status === 404) return new InvoiceError('Invoice not found.', 404, 'not_found');
  console.error(fallback, error);
  return new InvoiceError(fallback, 502, 'wix_error');
}

async function requireInvoicesPlan(): Promise<void> {
  const entitlement = await getAppEntitlement();
  if (!entitlement.features.invoices) throw new InvoiceError('Invoices are available on the Business plan.', 403, 'upgrade_required');
}

const unwrap = (response: unknown): unknown => record(response).invoice ?? response;

/** Loads an invoice and makes sure this app created it. */
async function getAppInvoice(id: string): Promise<InvoiceRecord> {
  let wixInvoice: unknown;
  try {
    wixInvoice = unwrap(await auth.elevate(invoices.getInvoice)(id));
  } catch (error) {
    throw toInvoiceError(error, 'Wix couldn’t load the invoice. Please try again.');
  }
  if (record(record(wixInvoice).sourceReference).appId !== APP_ID) throw new InvoiceError('Invoice not found.', 404, 'not_found');
  return summarizeWixInvoice(wixInvoice);
}

/**
 * A pre-filled draft for a quote request, using the live listing when it still exists.
 * A request without a site contact gets one now (and keeps it), since invoices need a contact.
 */
export async function getInvoiceDraftForQuote(quoteRequestId: string): Promise<InvoiceDraftInput> {
  await requireInvoicesPlan();
  const existing = await auth.elevate(items.get)(QUOTE_REQUESTS_COLLECTION_ID, quoteRequestId);
  if (!existing) throw new InvoiceError('Quote request not found.', 404);
  const request = normalizeQuoteRequest(existing);
  if (!request.contactId) {
    const contactId = await upsertQuoteContact({ firstName: request.firstName, lastName: request.lastName, email: request.email, phone: request.phone || undefined });
    if (contactId) {
      request.contactId = contactId;
      await auth.elevate(items.update)(QUOTE_REQUESTS_COLLECTION_ID, { ...existing, contactId }).catch((error) => console.error('Contact created, but the quote request could not be linked to it.', error));
    }
  }
  const listing = request.listingId ? await getListing(request.listingId).catch(() => null) : null;
  return draftFromQuoteRequest(request, listing ?? undefined);
}

async function markQuoteRequestQuoted(quoteRequestId: string): Promise<void> {
  try {
    const existing = await auth.elevate(items.get)(QUOTE_REQUESTS_COLLECTION_ID, quoteRequestId);
    if (!existing) return;
    const { status } = normalizeQuoteRequest(existing);
    if (status === 'new' || status === 'contacted') await auth.elevate(items.update)(QUOTE_REQUESTS_COLLECTION_ID, { ...existing, status: 'quoted' });
  } catch (error) {
    // The invoice exists; only the request's status is behind.
    console.error('Invoice created, but the quote request status could not be updated.', error);
  }
}

/*
 * Wix Invoices has no idempotency key, so a retried create (double click, network retry)
 * is answered from this short-lived, per-worker map. It's best effort: the dashboard also
 * disables the button while sending.
 */
const recentCreates = new Map<string, { at: number; result: Promise<CreatedInvoice> }>();
const RECENT_MS = 10 * 60 * 1000;

/**
 * Creates a standalone Wix invoice as a draft. With `send: true` it is also published
 * (assigns the number), emailed to the customer and given an online payment link; those
 * steps are best effort: a failure is returned as `warning` and the agent can retry with
 * Send / Get payment link.
 */
export async function createAndSendInvoice(input: unknown): Promise<CreatedInvoice> {
  const body = record(input);
  const key = typeof body.idempotencyKey === 'string' && GUID.test(body.idempotencyKey) ? body.idempotencyKey : undefined;
  if (!key) throw new InvoiceError('A valid idempotency key is required.', 400);
  const parsed = parseInvoiceDraft(body);
  if (!parsed.value) throw new InvoiceError(Object.values(parsed.errors).join(' '), 422, 'invalid', parsed.errors);
  const draft = parsed.value;

  const now = Date.now();
  for (const [entryKey, entry] of recentCreates) if (now - entry.at > RECENT_MS) recentCreates.delete(entryKey);
  const recent = recentCreates.get(key);
  if (recent) return recent.result;

  const result = createInvoiceOnce(draft, body.send === true);
  recentCreates.set(key, { at: now, result });
  // Failed attempts may be retried with the same key.
  result.catch(() => recentCreates.delete(key));
  return result;
}

async function createInvoiceOnce(input: InvoiceDraftInput, send: boolean): Promise<CreatedInvoice> {
  let draft = input;
  await requireInvoicesPlan();

  // The invoice goes to the chosen site contact; its details come from Contacts, not the request body.
  const contact = await getContactOption(draft.customer.contactId);
  if (!contact) throw new InvoiceError('That contact no longer exists. Choose another contact.', 404, 'contact_not_found', { customer: 'Choose another contact.' });
  if (!contact.email) throw new InvoiceError('That contact has no email address, so the invoice can’t be sent. Add an email in Contacts or choose another contact.', 422, 'contact_no_email', { customer: 'This contact has no email address.' });
  draft = { ...draft, customer: { contactId: contact.id, firstName: contact.firstName, lastName: contact.lastName, email: contact.email, phone: contact.phone } };
  const contactId = contact.id;

  let wixInvoice: unknown;
  try {
    wixInvoice = await auth.elevate(invoices.createInvoice)(toWixInvoice(draft, contactId, new Date(), APP_ID));
  } catch (error) {
    throw toInvoiceError(error, 'Wix couldn’t create the invoice. Please try again.');
  }

  const invoiceId = summarizeWixInvoice(wixInvoice)._id;
  if (!send) return { invoice: withDraftCustomer(summarizeWixInvoice(wixInvoice), draft) };

  let checkoutUrl: string | undefined;
  let warning: string | undefined;
  try {
    wixInvoice = unwrap(await auth.elevate(invoices.publishInvoice)(invoiceId));
    wixInvoice = unwrap(await auth.elevate(invoices.sendInvoice)(invoiceId, draft.message ? { messageContent: draft.message } : {}));
    checkoutUrl = (await auth.elevate(invoices.initiatePayment)(invoiceId)).url || undefined;
  } catch (error) {
    warning = toInvoiceError(error, 'The invoice was created but not fully sent. Use Resend or Get payment link to retry.').message;
  }

  if (draft.quoteRequestId && !warning) await markQuoteRequestQuoted(draft.quoteRequestId);
  return { invoice: withDraftCustomer(summarizeWixInvoice(wixInvoice), draft), checkoutUrl, warning };
}

/** Wix may omit contact details in a response; fall back to what the agent entered. */
function withDraftCustomer(invoice: InvoiceRecord, draft: InvoiceDraftInput): InvoiceRecord {
  return {
    ...invoice,
    customerName: invoice.customerName || [draft.customer.firstName, draft.customer.lastName].filter(Boolean).join(' '),
    customerEmail: invoice.customerEmail || draft.customer.email,
  };
}

/**
 * Lists this app's invoices with Wix Search Invoices (newest first, cursor paging).
 * Pass the previous response's `nextCursor` to load the next page; Wix applies the
 * original filter and search through the cursor.
 */
export async function listInvoices(options: { pageSize: number; filter: InvoiceFilter; search: string; quoteRequestId?: string; cursor?: string }) {
  await requireInvoicesPlan();
  const cursorPaging = { limit: options.pageSize, ...(options.cursor ? { cursor: options.cursor } : {}) };
  let request: Record<string, unknown>;
  if (options.cursor) {
    request = { cursorPaging };
  } else {
    const filter: Record<string, unknown> = { 'sourceReference.appId': APP_ID, archived: false };
    const statuses = statusesForFilter(options.filter);
    if (statuses) filter.status = { $in: statuses };
    if (options.quoteRequestId) filter['sourceReference.externalReferenceId'] = options.quoteRequestId;
    request = {
      cursorPaging,
      filter,
      sort: [{ fieldName: '_createdDate', order: 'DESC' }],
      ...(options.search ? { search: { expression: options.search, mode: 'AND', fuzzy: true } } : {}),
    };
  }
  try {
    // The typed filter only lists literal field paths; this one is built dynamically.
    const result = await auth.elevate(invoices.searchInvoices)(request as never);
    const paging = record(result.pagingMetadata);
    const cursors = record(paging.cursors);
    const nextCursor = text(cursors.next, 2000) || undefined;
    return {
      items: (result.invoices ?? []).map(summarizeWixInvoice),
      nextCursor,
      total: typeof paging.total === 'number' ? paging.total : undefined,
    };
  } catch (error) {
    throw toInvoiceError(error, 'Wix couldn’t load the invoices. Please try again.');
  }
}

/** The invoice as Wix has it now. */
export async function getInvoice(id: string): Promise<InvoiceRecord> {
  await requireInvoicesPlan();
  return getAppInvoice(id);
}

/** Emails the invoice to the customer, publishing it first if it's still a draft. */
export async function resendInvoice(id: string, message?: unknown): Promise<InvoiceRecord> {
  await requireInvoicesPlan();
  const existing = await getAppInvoice(id);
  if (existing.status === 'PAID' || existing.status === 'VOIDED') throw new InvoiceError('This invoice is already closed.', 409, 'not_payable');
  const messageContent = text(message, 2000);
  try {
    if (existing.status === 'DRAFT') await auth.elevate(invoices.publishInvoice)(id);
    const sent = summarizeWixInvoice(unwrap(await auth.elevate(invoices.sendInvoice)(id, messageContent ? { messageContent } : {})));
    if (sent.quoteRequestId) await markQuoteRequestQuoted(sent.quoteRequestId);
    return sent;
  } catch (error) {
    throw toInvoiceError(error, 'Wix couldn’t send the invoice. Please try again.');
  }
}

/** Creates an online payment (checkout) link, publishing a draft first. */
export async function getPaymentLink(id: string): Promise<{ invoice: InvoiceRecord; checkoutUrl: string }> {
  await requireInvoicesPlan();
  let invoice = await getAppInvoice(id);
  if (invoice.status === 'PAID' || invoice.status === 'VOIDED') throw new InvoiceError('This invoice can no longer be paid.', 409, 'not_payable');
  try {
    if (invoice.status === 'DRAFT') invoice = summarizeWixInvoice(unwrap(await auth.elevate(invoices.publishInvoice)(id)));
    const payment = await auth.elevate(invoices.initiatePayment)(id);
    if (!payment.url) throw new Error('Wix returned no payment link.');
    return { invoice, checkoutUrl: payment.url };
  } catch (error) {
    throw toInvoiceError(error, 'Wix couldn’t create a payment link. Make sure online payments are set up on the site.');
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Runs a dashboard invoice action and turns its result or error into a JSON response. */
export async function invoiceResponse(action: () => Promise<unknown>, fallback: string): Promise<Response> {
  try {
    return json(await action());
  } catch (error) {
    if (error instanceof InvoiceError) return json({ message: error.message, code: error.code, errors: error.errors }, error.status);
    console.error(fallback, error);
    return json({ message: fallback }, 500);
  }
}
