import { httpClient } from '@wix/essentials';
import { QUOTE_REQUEST_STATUSES, type QuoteRequest, type QuoteRequestStatus } from './listing-types';
import type { QuoteConfirmationTemplate } from './quote-email-template';

export { QUOTE_REQUEST_STATUSES };
export type { QuoteRequest, QuoteRequestStatus };
export const isQuoteRequestStatus = (value: unknown): value is QuoteRequestStatus => QUOTE_REQUEST_STATUSES.some((item) => item.value === value);
const origin = () => new URL(import.meta.url).origin;
const request = async <T>(path: string, init?: RequestInit): Promise<T> => { const response = await httpClient.fetchWithAuth(`${origin()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }); const body = await response.json() as { message?: string } | T; if (!response.ok) throw new Error(typeof body === 'object' && body !== null && 'message' in body ? body.message : 'The quote request failed.'); return body as T; };
export type QuoteRequestView = 'active' | 'archived' | 'all';
export type QuoteRequestCounts = Record<QuoteRequestStatus | 'active' | 'archived', number>;
export async function queryQuoteRequests(options: { page: number; pageSize: number; search: string; status?: QuoteRequestStatus; view?: QuoteRequestView; withCounts?: boolean }) { const params = new URLSearchParams({ page: String(options.page), pageSize: String(options.pageSize), search: options.search, view: options.view ?? 'active' }); if (options.status) params.set('status', options.status); if (options.withCounts) params.set('counts', '1'); return request<{ items: QuoteRequest[]; totalCount: number; hasNext: boolean; counts?: QuoteRequestCounts }>(`/api/quote-requests?${params}`, { cache: 'no-store' }); }
export async function updateQuoteRequest(id: string, update: { status?: QuoteRequestStatus; notes?: string; archived?: boolean }) { return request<QuoteRequest>(`/api/quote-requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(update) }); }
export async function getQuoteConfirmationTemplate() { return request<QuoteConfirmationTemplate>('/api/quote-requests/email-template', { cache: 'no-store' }); }
export async function saveQuoteConfirmationTemplate(template: QuoteConfirmationTemplate) { return request<QuoteConfirmationTemplate>('/api/quote-requests/email-template', { method: 'PUT', body: JSON.stringify(template) }); }
export async function sendQuoteReply(id: string, email: { subject: string; body: string; idempotencyKey: string }) { return request<QuoteRequest>(`/api/quote-requests/${encodeURIComponent(id)}/email`, { method: 'POST', body: JSON.stringify(email) }); }
