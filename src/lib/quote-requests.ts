import { httpClient } from '@wix/essentials';
import { QUOTE_REQUEST_STATUSES, type QuoteRequest, type QuoteRequestStatus } from './listing-types';

export { QUOTE_REQUEST_STATUSES };
export type { QuoteRequest, QuoteRequestStatus };
export const isQuoteRequestStatus = (value: unknown): value is QuoteRequestStatus => QUOTE_REQUEST_STATUSES.some((item) => item.value === value);
const origin = () => new URL(import.meta.url).origin;
const request = async <T>(path: string, init?: RequestInit): Promise<T> => { const response = await httpClient.fetchWithAuth(`${origin()}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }); const body = await response.json() as { message?: string } | T; if (!response.ok) throw new Error(typeof body === 'object' && body !== null && 'message' in body ? body.message : 'The quote request failed.'); return body as T; };
export async function queryQuoteRequests(options: { page: number; pageSize: number; search: string; status?: QuoteRequestStatus; includeArchived?: boolean }) { const params = new URLSearchParams({ page: String(options.page), pageSize: String(options.pageSize), search: options.search, includeArchived: String(options.includeArchived ?? false) }); if (options.status) params.set('status', options.status); return request<{ items: QuoteRequest[]; totalCount: number; hasNext: boolean }>(`/api/quote-requests?${params}`); }
export async function updateQuoteRequest(id: string, update: { status?: QuoteRequestStatus; notes?: string; archived?: boolean }) { return request<QuoteRequest>(`/api/quote-requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(update) }); }
