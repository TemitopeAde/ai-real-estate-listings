/**
 * Pure invoice helpers shared by the dashboard and the server.
 * No `@wix/*` runtime imports, so node tests can load this file directly.
 */
import { CURRENCIES } from './currencies.ts';

export const INVOICE_STATUSES = ['DRAFT', 'PUBLISHING', 'PUBLISHED', 'PARTIALLY_PAID', 'PAID', 'VOIDED'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type InvoiceQualifier = 'SENT' | 'VIEWED' | 'OVERDUE';

/** One badge per invoice, derived from the Wix status and its qualifiers. */
export type InvoiceDisplayStatus = 'draft' | 'published' | 'sent' | 'viewed' | 'overdue' | 'partially_paid' | 'paid' | 'voided';

/** Filters offered by the invoices list. */
export const INVOICE_FILTERS = ['all', 'unpaid', 'paid', 'voided'] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

export interface InvoiceRecord {
  /** The Wix invoice ID. */
  _id: string;
  number: string;
  status: InvoiceStatus;
  statusQualifiers: InvoiceQualifier[];
  title: string;
  currency: string;
  total: number;
  paidAmount: number;
  balance: number;
  dueDate?: Date;
  contactId: string;
  customerName: string;
  customerEmail: string;
  /** Read from `sourceReference.externalReferenceId`. */
  quoteRequestId?: string;
  /** Read from `sourceReference.externalProperties`. */
  listingId?: string;
  listingTitle?: string;
  /** Customer-facing invoice page on the site. */
  invoiceUrl?: string;
  _createdDate?: Date;
}

/** One invoice line per listing: the listing title is the item name. */
export interface InvoiceLineInput {
  listingId: string;
  name: string;
  description?: string;
  amount: number;
  quantity: number;
}

/** The site contact being invoiced. Name and email are for display; the server reloads them from Contacts. */
export interface InvoiceCustomerInput {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface InvoiceDraftInput {
  customer: InvoiceCustomerInput;
  title: string;
  currency: string;
  dueInDays: number;
  lineItems: InvoiceLineInput[];
  message?: string;
  quoteRequestId?: string;
  listingId?: string;
  listingTitle?: string;
}

export type InvoiceDraftErrors = Partial<Record<'customer' | 'title' | 'currency' | 'dueInDays' | 'lineItems', string>>;

export const INVOICE_LIMITS = { lineItems: 20, name: 200, description: 500, title: 200, message: 2000, maxDueInDays: 365, maxAmount: 1_000_000_000 } as const;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURRENCY_CODES = new Set(CURRENCIES.map((currency) => currency.value));

type Loose = Record<string, unknown>;
const record = (value: unknown): Loose => (typeof value === 'object' && value !== null ? value as Loose : {});
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const optional = (value: unknown, max: number) => text(value, max) || undefined;
const number = (value: unknown) => (typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN);
const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** Validates and normalizes untrusted draft input (request body or form state). */
export function parseInvoiceDraft(input: unknown): { value?: InvoiceDraftInput; errors: InvoiceDraftErrors } {
  const body = record(input);
  const customerBody = record(body.customer);
  const errors: InvoiceDraftErrors = {};

  const customer: InvoiceCustomerInput = {
    contactId: text(customerBody.contactId, 100),
    firstName: text(customerBody.firstName, 80),
    lastName: text(customerBody.lastName, 80),
    email: text(customerBody.email, 160).toLowerCase(),
    phone: optional(customerBody.phone, 40),
  };
  if (!customer.contactId) errors.customer = 'Choose a contact to invoice.';

  const title = text(body.title, INVOICE_LIMITS.title);
  if (!title) errors.title = 'Invoice title is required.';

  const currency = text(body.currency, 3).toUpperCase();
  if (!CURRENCY_CODES.has(currency)) errors.currency = 'Choose a valid currency.';

  const dueInDays = number(body.dueInDays);
  if (!Number.isInteger(dueInDays) || dueInDays < 0 || dueInDays > INVOICE_LIMITS.maxDueInDays) errors.dueInDays = `Due date must be 0–${INVOICE_LIMITS.maxDueInDays} days from today.`;

  const rawLines = Array.isArray(body.lineItems) ? body.lineItems : [];
  const lineItems: InvoiceLineInput[] = rawLines.slice(0, INVOICE_LIMITS.lineItems).map((line) => {
    const item = record(line);
    const quantity = number(item.quantity ?? 1);
    return {
      listingId: text(item.listingId, 100),
      name: text(item.name, INVOICE_LIMITS.name),
      description: optional(item.description, INVOICE_LIMITS.description),
      amount: roundMoney(number(item.amount)),
      quantity: Number.isInteger(quantity) ? quantity : Number.NaN,
    };
  });
  if (!lineItems.length) errors.lineItems = 'Add at least one line item.';
  else if (rawLines.length > INVOICE_LIMITS.lineItems) errors.lineItems = `An invoice can have up to ${INVOICE_LIMITS.lineItems} line items.`;
  else if (lineItems.some((line) => !line.listingId || !line.name)) errors.lineItems = 'Choose a listing for every line item.';
  else if (new Set(lineItems.map((line) => line.listingId)).size !== lineItems.length) errors.lineItems = 'Each listing can only be added once. Change the quantity instead.';
  else if (lineItems.some((line) => !Number.isFinite(line.amount) || line.amount <= 0 || line.amount > INVOICE_LIMITS.maxAmount)) errors.lineItems = 'Every line item needs an amount greater than zero.';
  else if (lineItems.some((line) => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 1000)) errors.lineItems = 'Quantities must be whole numbers from 1 to 1000.';

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    value: {
      customer,
      title,
      currency,
      dueInDays,
      lineItems,
      message: optional(body.message, INVOICE_LIMITS.message),
      quoteRequestId: optional(body.quoteRequestId, 100),
      // The invoice's main listing (stored on the Wix invoice) defaults to the first line's.
      listingId: optional(body.listingId, 100) ?? lineItems[0]?.listingId,
      listingTitle: optional(body.listingTitle, 200) ?? lineItems[0]?.name,
    },
  };
}

export function invoiceDraftTotal(lines: Pick<InvoiceLineInput, 'amount' | 'quantity'>[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) && Number.isFinite(line.quantity) ? line.amount * line.quantity : 0), 0));
}

export interface InvoiceListingSource {
  _id: string;
  title: string;
  price: number;
  transactionType?: string;
  rentalFrequency?: string;
}

/** What the listing is billed as, e.g. "Rent (monthly)" or "Purchase price". */
export function listingChargeLabel(listing: Pick<InvoiceListingSource, 'transactionType' | 'rentalFrequency'>): string {
  const renting = listing.transactionType === 'rent' || listing.transactionType === 'lease';
  if (!renting) return 'Purchase price';
  const frequency = listing.rentalFrequency === 'monthly' || listing.rentalFrequency === 'yearly' ? ` (${listing.rentalFrequency})` : '';
  return `${listing.transactionType === 'lease' ? 'Lease' : 'Rent'}${frequency}`;
}

/** The invoice line for a listing chosen in the dropdown: its title, charge type and price. */
export function lineItemFromListing(listing: InvoiceListingSource): InvoiceLineInput {
  return {
    listingId: listing._id,
    name: listing.title.slice(0, INVOICE_LIMITS.name),
    description: listingChargeLabel(listing),
    amount: listing.price > 0 ? roundMoney(listing.price) : 0,
    quantity: 1,
  };
}

export interface InvoiceQuoteSource {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  contactId?: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingCurrency: string;
}

/** Pre-filled draft for a quote request. Uses the live listing when available, else the request's price snapshot. */
export function draftFromQuoteRequest(request: InvoiceQuoteSource, listing?: InvoiceListingSource & { currency?: string }): InvoiceDraftInput {
  const source: InvoiceListingSource = listing ?? { _id: request.listingId, title: request.listingTitle, price: request.listingPrice };
  return {
    customer: { contactId: request.contactId ?? '', firstName: request.firstName, lastName: request.lastName, email: request.email, phone: request.phone || undefined },
    title: `Invoice – ${request.listingTitle || listing?.title || 'Property'}`.slice(0, INVOICE_LIMITS.title),
    currency: (listing?.currency || request.listingCurrency || 'USD').toUpperCase(),
    dueInDays: 14,
    lineItems: source._id ? [lineItemFromListing(source)] : [],
    quoteRequestId: request._id,
    listingId: request.listingId || undefined,
    listingTitle: request.listingTitle || listing?.title || undefined,
  };
}

const money = (value: number) => roundMoney(value).toFixed(2);

/**
 * App metadata stored on the Wix invoice itself, so Wix stays the only source of truth:
 * the app ID (to list only this app's invoices), the quote request as the filterable
 * `externalReferenceId` (must be a GUID), and listing details as `externalProperties`.
 */
export function invoiceSourceReference(appId: string, draft: Pick<InvoiceDraftInput, 'quoteRequestId' | 'listingId' | 'listingTitle'>) {
  const properties: Record<string, string> = {};
  if (draft.quoteRequestId) properties.quoteRequestId = draft.quoteRequestId.slice(0, 100);
  if (draft.listingId) properties.listingId = draft.listingId.slice(0, 100);
  if (draft.listingTitle) properties.listingTitle = draft.listingTitle.slice(0, 100);
  return {
    appId,
    ...(draft.quoteRequestId && GUID.test(draft.quoteRequestId) ? { externalReferenceId: draft.quoteRequestId } : {}),
    ...(Object.keys(properties).length ? { externalProperties: properties } : {}),
  };
}

/** The Create Invoice payload (Wix Get Paid Invoices v4) for a validated draft. */
export function toWixInvoice(draft: InvoiceDraftInput, contactId: string, now: Date, appId: string) {
  const dueDate = new Date(now.getTime() + draft.dueInDays * 24 * 60 * 60 * 1000);
  return {
    sourceReference: invoiceSourceReference(appId, draft),
    reference: { referenceType: 'STANDALONE' as const, standaloneReference: {} },
    issueDate: now,
    dueDate,
    title: draft.title,
    currency: draft.currency,
    customerInfo: {
      contactId,
      contactDetails: {
        ...(draft.customer.firstName ? { firstName: draft.customer.firstName } : {}),
        ...(draft.customer.lastName ? { lastName: draft.customer.lastName } : {}),
        ...(draft.customer.email ? { email: draft.customer.email } : {}),
        ...(draft.customer.phone ? { phone: draft.customer.phone } : {}),
      },
    },
    lineItems: draft.lineItems.map((line) => ({
      lineItemType: 'CUSTOM' as const,
      customItem: {
        name: line.name,
        ...(line.description ? { description: line.description } : {}),
        quantity: String(line.quantity),
        price: money(line.amount),
      },
    })),
  };
}

const QUALIFIERS: InvoiceQualifier[] = ['SENT', 'VIEWED', 'OVERDUE'];
const amount = (value: unknown) => { const parsed = number(value); return Number.isFinite(parsed) ? parsed : 0; };
const dateValue = (value: unknown) => { if (!value) return undefined; const parsed = value instanceof Date ? value : new Date(String(value)); return Number.isNaN(parsed.getTime()) ? undefined : parsed; };

/** The dashboard's view of a Wix invoice (from create, get, publish, send or search). */
export function summarizeWixInvoice(invoice: unknown): InvoiceRecord {
  const item = record(invoice);
  const source = record(item.sourceReference);
  const properties = record(source.externalProperties);
  const numbering = record(item.numbering);
  const totals = record(item.totals);
  const customer = record(item.customerInfo);
  const details = record(customer.contactDetails);
  const links = record(item.links);
  const status = INVOICE_STATUSES.find((value) => value === item.status) ?? 'DRAFT';
  const qualifiers = Array.isArray(item.statusQualifiers) ? item.statusQualifiers.filter((value): value is InvoiceQualifier => QUALIFIERS.includes(value as InvoiceQualifier)) : [];
  const total = amount(totals.total);
  const paidAmount = amount(totals.paidAmount);
  return {
    _id: text(item._id ?? item.id, 100),
    number: text(numbering.displayNumber, 60) || (typeof numbering.number === 'number' ? String(numbering.number) : ''),
    status,
    statusQualifiers: qualifiers,
    title: text(item.title, INVOICE_LIMITS.title),
    currency: text(item.currency, 3),
    total,
    paidAmount,
    balance: totals.balance === undefined || totals.balance === null ? roundMoney(total - paidAmount) : amount(totals.balance),
    dueDate: dateValue(item.dueDate),
    contactId: text(customer.contactId, 100),
    customerName: [text(details.firstName, 80), text(details.lastName, 80)].filter(Boolean).join(' '),
    customerEmail: text(details.email, 160),
    quoteRequestId: optional(source.externalReferenceId, 100) ?? optional(properties.quoteRequestId, 100),
    listingId: optional(properties.listingId, 100),
    listingTitle: optional(properties.listingTitle, 200),
    invoiceUrl: optional(links.url, 1000),
    _createdDate: dateValue(item._createdDate ?? item.createdDate),
  };
}

export function invoiceDisplayStatus(invoice: Pick<InvoiceRecord, 'status' | 'statusQualifiers'>): InvoiceDisplayStatus {
  switch (invoice.status) {
    case 'PAID': return 'paid';
    case 'VOIDED': return 'voided';
    case 'PARTIALLY_PAID': return 'partially_paid';
    case 'DRAFT': return 'draft';
    default:
      if (invoice.statusQualifiers.includes('OVERDUE')) return 'overdue';
      if (invoice.statusQualifiers.includes('VIEWED')) return 'viewed';
      if (invoice.statusQualifiers.includes('SENT')) return 'sent';
      return 'published';
  }
}

export function isInvoiceFilter(value: unknown): value is InvoiceFilter {
  return INVOICE_FILTERS.some((filter) => filter === value);
}

/** Wix statuses matched by a list filter; `undefined` means no status filter. */
export function statusesForFilter(filter: InvoiceFilter): InvoiceStatus[] | undefined {
  if (filter === 'paid') return ['PAID'];
  if (filter === 'voided') return ['VOIDED'];
  if (filter === 'unpaid') return ['DRAFT', 'PUBLISHING', 'PUBLISHED', 'PARTIALLY_PAID'];
  return undefined;
}
