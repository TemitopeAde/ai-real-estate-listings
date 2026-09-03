import { httpClient } from '@wix/essentials';
import type { InvoiceRequest } from './listing-types';

function origin(): string { return new URL(import.meta.url).origin; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await httpClient.fetchWithAuth(`${origin()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => null) as { message?: string } | T | null;
  if (!response.ok) throw new Error(body && typeof body === 'object' && 'message' in body && typeof body.message === 'string' ? body.message : 'The invoice request failed.');
  return body as T;
}

function normalize(item: InvoiceRequest): InvoiceRequest {
  return { ...item, _createdDate: item._createdDate ? new Date(item._createdDate) : undefined, _updatedDate: item._updatedDate ? new Date(item._updatedDate) : undefined, invoiceIssueDate: item.invoiceIssueDate ? new Date(item.invoiceIssueDate) : undefined, invoiceDueDate: item.invoiceDueDate ? new Date(item.invoiceDueDate) : undefined };
}

export async function queryInvoiceRequests(): Promise<InvoiceRequest[]> {
  const requests = await request<InvoiceRequest[]>('/api/invoice-requests');
  return requests.map(normalize);
}

export async function createInvoice(requestId: string, amount: number, issueDate: string, dueDate: string): Promise<InvoiceRequest> {
  return normalize(await request<InvoiceRequest>(`/api/invoice-requests/${encodeURIComponent(requestId)}/invoice`, { method: 'POST', body: JSON.stringify({ amount, issueDate, dueDate }) }));
}
