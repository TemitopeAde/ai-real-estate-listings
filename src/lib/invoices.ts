import { httpClient } from '@wix/essentials';
import type { InvoiceDraftErrors, InvoiceDraftInput, InvoiceFilter, InvoiceRecord } from './invoice-draft';

export * from './invoice-draft';

/** A failed invoice request; `code` is e.g. `upgrade_required` or `invoices_unavailable`. */
export class InvoiceRequestError extends Error {
  constructor(message: string, readonly code?: string, readonly errors?: InvoiceDraftErrors) { super(message); this.name = 'InvoiceRequestError'; }
}

export interface InvoicePage { items: InvoiceRecord[]; nextCursor?: string; total?: number }
export interface CreatedInvoice { invoice: InvoiceRecord; checkoutUrl?: string; warning?: string }

const origin = () => new URL(import.meta.url).origin;
const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await httpClient.fetchWithAuth(`${origin()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => ({})) as { message?: string; code?: string; errors?: InvoiceDraftErrors } | T;
  if (!response.ok) {
    const error = typeof body === 'object' && body !== null ? body as { message?: string; code?: string; errors?: InvoiceDraftErrors } : {};
    throw new InvoiceRequestError(error.message || 'The invoice request failed.', error.code, error.errors);
  }
  return body as T;
};

/** This app's invoices, read live from Wix. Pass `cursor` (a previous `nextCursor`) for the next page. */
export async function queryInvoices(options: { pageSize: number; filter?: InvoiceFilter; search?: string; quoteRequestId?: string; cursor?: string }) {
  const params = new URLSearchParams({ pageSize: String(options.pageSize) });
  if (options.cursor) params.set('cursor', options.cursor);
  else {
    params.set('filter', options.filter ?? 'all');
    if (options.search) params.set('search', options.search);
    if (options.quoteRequestId) params.set('quoteRequestId', options.quoteRequestId);
  }
  return request<InvoicePage>(`/api/invoices?${params}`, { cache: 'no-store' });
}

export async function getInvoiceDraftForQuote(quoteRequestId: string) {
  return request<InvoiceDraftInput>(`/api/invoices/draft?quoteRequestId=${encodeURIComponent(quoteRequestId)}`, { cache: 'no-store' });
}

/** Creates a draft invoice in Wix; `send` also publishes and emails it and creates a payment link. */
export async function createInvoice(draft: InvoiceDraftInput, idempotencyKey: string, send = false) {
  return request<CreatedInvoice>('/api/invoices', { method: 'POST', body: JSON.stringify({ ...draft, idempotencyKey, send }) });
}

export async function getInvoice(id: string) {
  return request<InvoiceRecord>(`/api/invoices/${encodeURIComponent(id)}`, { cache: 'no-store' });
}

export async function resendInvoice(id: string, message?: string) {
  return request<InvoiceRecord>(`/api/invoices/${encodeURIComponent(id)}/send`, { method: 'POST', body: JSON.stringify({ message }) });
}

export async function getInvoicePaymentLink(id: string) {
  return request<{ invoice: InvoiceRecord; checkoutUrl: string }>(`/api/invoices/${encodeURIComponent(id)}/payment-link`, { method: 'POST' });
}
