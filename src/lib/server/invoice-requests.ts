import { contactsV5 } from '@wix/crm';
import { invoices } from '@wix/get-paid';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';

import {
  INVOICE_REQUEST_STATUSES,
  LISTINGS_COLLECTION_ID,
  type InvoiceRequest,
  type InvoiceRequestInput,
  type InvoiceRequestStatus,
  type Listing,
} from '@/lib/listing-types';

export const INVOICE_REQUESTS_COLLECTION_ID =
  '@admin14744/ai-real-estate-listings/quote-requests';

type WixRecord = Record<string, unknown> & { _id?: string; _createdDate?: Date; _updatedDate?: Date };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function date(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function status(value: unknown): InvoiceRequestStatus {
  return typeof value === 'string' && INVOICE_REQUEST_STATUSES.includes(value as InvoiceRequestStatus)
    ? value as InvoiceRequestStatus
    : 'new';
}

export function normalizeInvoiceRequest(item: WixRecord): InvoiceRequest {
  return {
    _id: item._id ?? '',
    _createdDate: date(item._createdDate),
    _updatedDate: date(item._updatedDate),
    listingId: text(item.listingId),
    listingTitle: text(item.listingTitle),
    firstName: text(item.firstName),
    lastName: text(item.lastName),
    email: text(item.email),
    phone: text(item.phone),
    country: text(item.country),
    state: text(item.state),
    city: text(item.city),
    postalCode: text(item.postalCode),
    streetAddress: text(item.streetAddress),
    message: text(item.message) || undefined,
    status: status(item.status),
    contactId: text(item.contactId) || undefined,
    invoiceId: text(item.invoiceId) || undefined,
    invoiceAmount: number(item.invoiceAmount),
    invoiceCurrency: text(item.invoiceCurrency) || undefined,
    invoiceIssueDate: date(item.invoiceIssueDate),
    invoiceDueDate: date(item.invoiceDueDate),
  };
}

function validateRequest(input: InvoiceRequestInput): string[] {
  const required: Array<keyof InvoiceRequestInput> = [
    'listingId', 'listingTitle', 'firstName', 'lastName', 'email', 'phone',
    'country', 'state', 'city', 'postalCode', 'streetAddress',
  ];
  const errors = required.filter((key) => !text(input[key])).map((key) => `${key} is required.`);
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) errors.push('A valid email address is required.');
  return errors;
}

export async function createInvoiceRequest(input: InvoiceRequestInput): Promise<InvoiceRequest> {
  const errors = validateRequest(input);
  if (errors.length) throw new Error(errors.join(' '));

  const listing = await auth.elevate(items.get)(LISTINGS_COLLECTION_ID, input.listingId) as Listing | null;
  if (!listing || listing.status !== 'active') throw new Error('This property is not currently available.');

  const inserted = await auth.elevate(items.insert)(INVOICE_REQUESTS_COLLECTION_ID, {
    ...input,
    listingId: listing._id,
    listingTitle: listing.title,
    status: 'new',
  });
  return normalizeInvoiceRequest(inserted as WixRecord);
}

export async function queryInvoiceRequests(): Promise<InvoiceRequest[]> {
  const result = await auth.elevate(items.query)(INVOICE_REQUESTS_COLLECTION_ID)
    .descending('_createdDate')
    .limit(100)
    .find();
  return result.items.map((item) => normalizeInvoiceRequest(item as WixRecord));
}

export async function getInvoiceRequest(id: string): Promise<InvoiceRequest | null> {
  try {
    const item = await auth.elevate(items.get)(INVOICE_REQUESTS_COLLECTION_ID, id);
    return normalizeInvoiceRequest(item as WixRecord);
  } catch {
    return null;
  }
}

export async function createInvoiceFromRequest(
  requestId: string,
  amount: number,
  issueDate: Date,
  dueDate: Date,
): Promise<InvoiceRequest> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invoice amount must be greater than zero.');
  if (dueDate < issueDate) throw new Error('The due date cannot be before the issue date.');

  const request = await getInvoiceRequest(requestId);
  if (!request) throw new Error('The invoice request could not be found.');
  if (request.invoiceId) throw new Error('An invoice has already been created for this request.');

  const listing = await auth.elevate(items.get)(LISTINGS_COLLECTION_ID, request.listingId) as Listing | null;
  if (!listing) throw new Error('The property connected to this request could not be found.');

  const contact = await auth.elevate(contactsV5.upsertContact)({
    name: { first: request.firstName, last: request.lastName },
    email: { email: request.email },
    phone: { phone: request.phone },
    addresses: [{
      address: {
        country: request.country,
        subdivision: request.state,
        city: request.city,
        postalCode: request.postalCode,
        streetAddress: { name: request.streetAddress },
      },
    }],
  }, { upsertMode: 'OVERWRITE_APPEND_ARRAYS' });

  const contactId = contact.contact?._id;
  if (!contactId) throw new Error('Wix CRM did not return a customer contact ID.');

  const invoice = await auth.elevate(invoices.createInvoice)({
    issueDate,
    dueDate,
    sourceReference: {
      appId: 'c00de2bd-7278-4471-8292-52e8b7a7158c',
      externalReferenceId: request._id,
    },
    reference: { referenceType: 'STANDALONE', standaloneReference: { limitActions: true } },
    currency: listing.currency,
    title: `Property invoice - ${request.listingTitle}`,
    customerInfo: {
      contactId,
      contactDetails: {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
      },
      billingAddress: {
        country: request.country,
        subdivision: request.state,
        city: request.city,
        postalCode: request.postalCode,
        streetAddress: { name: request.streetAddress },
      },
    },
    shippingInfo: {
      contactDetails: { email: request.email },
      shippingAddress: {
        country: request.country,
        subdivision: request.state,
        city: request.city,
        postalCode: request.postalCode,
        streetAddress: { name: request.streetAddress },
      },
    },
    lineItems: [{
      lineItemType: 'CUSTOM',
      customItem: {
        name: request.listingTitle,
        description: request.message ?? 'Property transaction',
        quantity: '1',
        price: amount.toFixed(2),
      },
    }],
    shipmentInfo: { price: '0' },
  });

  const invoiceId = 'id' in invoice && typeof invoice.id === 'string' ? invoice.id : undefined;
  if (!invoiceId) throw new Error('Wix Invoices did not return an invoice ID.');
  const updated = await auth.elevate(items.update)(INVOICE_REQUESTS_COLLECTION_ID, {
    _id: request._id,
    status: 'invoiced',
    contactId,
    invoiceId,
    invoiceAmount: amount,
    invoiceCurrency: listing.currency,
    invoiceIssueDate: issueDate,
    invoiceDueDate: dueDate,
  });
  return normalizeInvoiceRequest(updated as WixRecord);
}
