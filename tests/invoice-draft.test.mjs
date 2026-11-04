import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draftFromQuoteRequest,
  invoiceDisplayStatus,
  invoiceSourceReference,
  invoiceDraftTotal,
  lineItemFromListing,
  parseInvoiceDraft,
  statusesForFilter,
  summarizeWixInvoice,
  toWixInvoice,
} from '../src/lib/invoice-draft.ts';

const validDraft = {
  customer: { contactId: 'c-1', firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com' },
  title: 'Invoice – Lekki flat',
  currency: 'ngn',
  dueInDays: '14',
  lineItems: [{ listingId: 'l1', name: 'Lekki flat', description: 'Rent (yearly)', amount: '2500000.456', quantity: 1 }],
};

test('valid drafts are normalized', () => {
  const { value, errors } = parseInvoiceDraft(validDraft);
  assert.deepEqual(errors, {});
  assert.equal(value.customer.contactId, 'c-1');
  assert.equal(value.currency, 'NGN');
  assert.equal(value.dueInDays, 14);
  assert.equal(value.lineItems[0].amount, 2500000.46);
});

test('invalid drafts report each problem', () => {
  const { value, errors } = parseInvoiceDraft({ customer: { email: 'someone@example.com' }, title: '', currency: 'XXX1', dueInDays: 500, lineItems: [] });
  assert.equal(value, undefined);
  assert.match(errors.customer, /Choose a contact/);
  assert.ok(errors.title && errors.currency && errors.dueInDays && errors.lineItems);
  assert.match(parseInvoiceDraft({ ...validDraft, lineItems: [{ listingId: 'l1', name: 'Rent', amount: 0, quantity: 1 }] }).errors.lineItems, /greater than zero/);
  assert.match(parseInvoiceDraft({ ...validDraft, lineItems: [{ listingId: 'l1', name: 'Rent', amount: 5, quantity: 1.5 }] }).errors.lineItems, /whole numbers/);
});

test('a contact is all the customer needs; name and email are display only', () => {
  const { value } = parseInvoiceDraft({ ...validDraft, customer: { contactId: 'c-1' } });
  assert.equal(value.customer.contactId, 'c-1');
  assert.equal(value.customer.email, '');
});

test('a listing becomes one line: title, charge type and price', () => {
  assert.deepEqual(lineItemFromListing({ _id: 'l1', title: 'Flat', price: 1200, transactionType: 'rent', rentalFrequency: 'monthly' }), {
    listingId: 'l1', name: 'Flat', description: 'Rent (monthly)', amount: 1200, quantity: 1,
  });
  assert.equal(lineItemFromListing({ _id: 'l2', title: 'House', price: 350000, transactionType: 'sale' }).description, 'Purchase price');
  assert.equal(lineItemFromListing({ _id: 'l3', title: 'Office', price: 0, transactionType: 'lease' }).description, 'Lease');
});

test('every line must be a listing, and the first one becomes the invoice listing', () => {
  assert.match(parseInvoiceDraft({ ...validDraft, lineItems: [{ name: 'Custom', amount: 5, quantity: 1 }] }).errors.lineItems, /Choose a listing/);
  const { value } = parseInvoiceDraft(validDraft);
  assert.equal(value.listingId, 'l1');
  assert.equal(value.listingTitle, 'Lekki flat');
});

test('quote request drafts prefer the live listing and keep the contact', () => {
  const request = { _id: 'q1', firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', contactId: 'c-9', listingId: 'l1', listingTitle: 'Flat', listingPrice: 900, listingCurrency: 'gbp' };
  const fromSnapshot = draftFromQuoteRequest(request);
  assert.equal(fromSnapshot.currency, 'GBP');
  assert.equal(fromSnapshot.customer.contactId, 'c-9');
  assert.equal(fromSnapshot.lineItems[0].amount, 900);
  assert.equal(fromSnapshot.quoteRequestId, 'q1');
  assert.equal(fromSnapshot.lineItems[0].listingId, 'l1');
  const fromListing = draftFromQuoteRequest(request, { _id: 'l1', title: 'Flat', price: 1000, currency: 'EUR', transactionType: 'rent', rentalFrequency: 'yearly' });
  assert.equal(fromListing.currency, 'EUR');
  assert.deepEqual(fromListing.lineItems, [{ listingId: 'l1', name: 'Flat', description: 'Rent (yearly)', amount: 1000, quantity: 1 }]);
});

test('the Wix payload is a standalone invoice with decimal strings', () => {
  const { value } = parseInvoiceDraft({ ...validDraft, lineItems: [{ listingId: 'l1', name: 'Rent', amount: 1000, quantity: 2, description: 'Flat' }] });
  const now = new Date('2026-01-01T00:00:00Z');
  const payload = toWixInvoice(value, 'contact-1', now, 'app-1');
  assert.deepEqual(payload.sourceReference, { appId: 'app-1', externalProperties: { listingId: 'l1', listingTitle: 'Rent' } });
  assert.deepEqual(payload.reference, { referenceType: 'STANDALONE', standaloneReference: {} });
  assert.equal(payload.customerInfo.contactId, 'contact-1');
  assert.equal(payload.dueDate.toISOString(), '2026-01-15T00:00:00.000Z');
  assert.deepEqual(payload.lineItems[0], { lineItemType: 'CUSTOM', customItem: { name: 'Rent', description: 'Flat', quantity: '2', price: '1000.00' } });
  assert.equal(invoiceDraftTotal(value.lineItems), 2000);
});

test('Wix invoices are summarized for the local index', () => {
  const summary = summarizeWixInvoice({
    _id: 'inv-1', status: 'PUBLISHED', statusQualifiers: ['SENT', 'OVERDUE', 'BOGUS'], currency: 'USD', title: 'T',
    numbering: { displayNumber: 'INV-0007' }, totals: { total: '150.50', paidAmount: '50' },
    customerInfo: { contactId: 'c1', contactDetails: { firstName: 'Ada', lastName: 'Obi', email: 'a@b.co' } },
    dueDate: '2026-02-01T00:00:00Z', links: { url: 'https://site.example/invoice/1' },
    _createdDate: '2026-01-01T00:00:00Z',
    sourceReference: { appId: 'app-1', externalReferenceId: 'q-guid', externalProperties: { listingId: 'l1', listingTitle: 'Flat' } },
  });
  assert.equal(summary.quoteRequestId, 'q-guid');
  assert.equal(summary.listingId, 'l1');
  assert.equal(summary.listingTitle, 'Flat');
  assert.equal(summary._createdDate.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(summary.number, 'INV-0007');
  assert.deepEqual(summary.statusQualifiers, ['SENT', 'OVERDUE']);
  assert.equal(summary.total, 150.5);
  assert.equal(summary.balance, 100.5);
  assert.equal(summary.customerName, 'Ada Obi');
  assert.equal(summary.invoiceUrl, 'https://site.example/invoice/1');
  assert.equal(invoiceDisplayStatus(summary), 'overdue');
});

test('display status and filters', () => {
  assert.equal(invoiceDisplayStatus({ status: 'PAID', statusQualifiers: ['OVERDUE'] }), 'paid');
  assert.equal(invoiceDisplayStatus({ status: 'PUBLISHED', statusQualifiers: ['SENT', 'VIEWED'] }), 'viewed');
  assert.equal(invoiceDisplayStatus({ status: 'PUBLISHED', statusQualifiers: [] }), 'published');
  assert.deepEqual(statusesForFilter('paid'), ['PAID']);
  assert.equal(statusesForFilter('all'), undefined);
  assert.ok(statusesForFilter('unpaid').includes('PARTIALLY_PAID'));
});

test('the source reference links quote requests only when the ID is a GUID', () => {
  const quoteRequestId = '3f2b8c1e-9a4d-4e2b-8f1a-0c5d6e7f8a9b';
  assert.deepEqual(invoiceSourceReference('app-1', { quoteRequestId, listingId: 'l1', listingTitle: 'x'.repeat(150) }), {
    appId: 'app-1',
    externalReferenceId: quoteRequestId,
    externalProperties: { quoteRequestId, listingId: 'l1', listingTitle: 'x'.repeat(100) },
  });
  // Non-GUID IDs can't be the filterable reference, but are kept as a property.
  assert.deepEqual(invoiceSourceReference('app-1', { quoteRequestId: 'legacy-id' }), {
    appId: 'app-1',
    externalProperties: { quoteRequestId: 'legacy-id' },
  });
  assert.deepEqual(invoiceSourceReference('app-1', {}), { appId: 'app-1' });
});
