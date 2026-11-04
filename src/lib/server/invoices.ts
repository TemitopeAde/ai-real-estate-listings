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

interface WixErrorInfo { status?: number; code?: string; reason?: string; requestId?: string }

/**
 * Status, code and human-readable reason of a Wix SDK error. The SDK sets `status`,
 * `details.applicationError` / `details.validationError` and `requestId` on the error,
 * and puts a JSON `{ message, details }` string in `message`.
 */
function wixErrorInfo(error: unknown): WixErrorInfo {
  const value = record(error);
  const details = record(value.details);
  const application = record(details.applicationError);
  const validation = record(details.validationError);
  const response = record(value.response);
  const status = [value.status, response.status].find((candidate): candidate is number => typeof candidate === 'number');
  const violations = Array.isArray(validation.fieldViolations)
    ? validation.fieldViolations.map((violation) => { const item = record(violation); return [text(item.field, 100), text(item.description, 200)].filter(Boolean).join(' '); }).filter(Boolean)
    : [];
  let messageText = text(value.message, 1000);
  try {
    const parsed = record(JSON.parse(messageText));
    if (typeof parsed.message === 'string') messageText = parsed.message.trim();
  } catch {
    // Not JSON: use the message as it is.
  }
  const reason = violations.join('; ') || text(application.description, 500) || messageText || undefined;
  const code = text(application.code, 100) || text(value.code, 100) || undefined;
  const requestId = text(value.requestId, 100) || text(details.requestId, 100) || undefined;
  return { status, code, reason, requestId };
}

/**
 * Maps a Wix Invoices API failure to an error the dashboard can explain, keeping Wix's own
 * reason and request ID. A 428 means "Invoices not enabled on this site" only for calls that
 * reach the Invoices service at all (create, list, get), so `siteCheck` limits that reading.
 */
function toInvoiceError(error: unknown, fallback: string, { siteCheck = false }: { siteCheck?: boolean } = {}): InvoiceError {
  if (error instanceof InvoiceError) return error;
  const info = wixErrorInfo(error);
  console.error(fallback, info, error);
  const suffix = `${info.reason ? ` Wix says: ${info.reason}` : ''}${info.requestId ? ` (request ID ${info.requestId})` : ''}`;
  if (info.status === 428 && siteCheck) {
    return new InvoiceError(`Wix Invoices isn’t available on this site yet. Wix is enabling it for existing sites gradually.${suffix}`, 409, 'invoices_unavailable');
  }
  if (info.status === 401 || info.status === 403) {
    return new InvoiceError(`The app doesn’t have permission for this invoice action. Make sure the app has the “Manage Invoices” permission.${suffix}`, 403, 'permission_missing');
  }
  if (info.status === 404) return new InvoiceError(`Invoice not found.${suffix}`, 404, 'not_found');
  return new InvoiceError(`${fallback}${suffix}`, 502, info.code ?? 'wix_error');
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
    throw toInvoiceError(error, 'Wix couldn’t load the invoice.', { siteCheck: true });
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
    throw toInvoiceError(error, 'Wix couldn’t create the invoice.', { siteCheck: true });
  }

  const invoiceId = summarizeWixInvoice(wixInvoice)._id;
  if (!send) return { invoice: withDraftCustomer(summarizeWixInvoice(wixInvoice), draft) };

  // Each step reports its own failure. If the email fails, still try to create the
  // payment link so the agent can share it another way.
  const warnings: string[] = [];
  let checkoutUrl: string | undefined;
  let sent = false;
  try {
    wixInvoice = unwrap(await auth.elevate(invoices.publishInvoice)(invoiceId));
  } catch (error) {
    const failure = toInvoiceError(error, 'The invoice was saved as a draft, but Wix couldn’t publish it. Open it from Invoices and choose Send to retry.');
    return { invoice: withDraftCustomer(summarizeWixInvoice(wixInvoice), draft), warning: failure.message };
  }
  try {
    wixInvoice = unwrap(await auth.elevate(invoices.sendInvoice)(invoiceId, draft.message ? { messageContent: draft.message } : {}));
    sent = true;
  } catch (error) {
    warnings.push(toInvoiceError(error, 'The invoice was published, but Wix couldn’t email it. Use Resend, or share the payment link.').message);
  }
  try {
    checkoutUrl = (await auth.elevate(invoices.initiatePayment)(invoiceId)).url || undefined;
  } catch (error) {
    warnings.push(toInvoiceError(error, 'Wix couldn’t create a payment link. Make sure online payments are set up on the site.').message);
  }
  const warning = warnings.length ? warnings.join(' ') : undefined;

  if (draft.quoteRequestId && sent) await markQuoteRequestQuoted(draft.quoteRequestId);
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
    throw toInvoiceError(error, 'Wix couldn’t load the invoices.', { siteCheck: true });
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
    throw toInvoiceError(error, 'Wix couldn’t send the invoice.');
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
