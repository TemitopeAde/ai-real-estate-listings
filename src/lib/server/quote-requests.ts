import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { notificationsV3 } from '@wix/notifications';

import { QUOTE_REQUESTS_COLLECTION_ID, QUOTE_REQUEST_STATUSES, type QuoteRequest, type QuoteRequestStatus } from '@/lib/listing-types';
import { getPublicListing } from '@/lib/server/listings';
import { normalizeRichText } from '@/lib/server/listing-validation';
import { getSiteOwnerContact } from '@/lib/server/site-owner';

type RecordValue = { _id?: string; [key: string]: unknown };

const requestTimes = new Map<string, number>();
const WINDOW_MS = 10 * 60 * 1000;

function record(value: unknown): RecordValue { return typeof value === 'object' && value !== null ? value as RecordValue : {}; }
function text(value: unknown, max: number): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function plainFromHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}
function richMessage(value: unknown): string {
  const html = normalizeRichText(typeof value === 'string' ? value : '').slice(0, 20_000);
  return plainFromHtml(html) ? html : '';
}
function email(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function phone(value: string): boolean { return /^[+()\d\s.-]{7,30}$/.test(value); }
function status(value: unknown): QuoteRequestStatus { return QUOTE_REQUEST_STATUSES.some((item) => item.value === value) ? value as QuoteRequestStatus : 'new'; }
function date(value: unknown): Date | undefined { const result = value instanceof Date ? value : new Date(String(value ?? '')); return Number.isNaN(result.getTime()) ? undefined : result; }

async function notifyQuoteRequest(request: QuoteRequest, agentEmail?: string): Promise<void> {
  const templateId = import.meta.env.QUOTE_REQUEST_NOTIFICATION_TEMPLATE_ID?.trim();
  if (!templateId) return;
  const ownerEmail = (await getSiteOwnerContact()).email ?? '';
  if (!ownerEmail && !agentEmail) return;
  try {
    await auth.elevate(notificationsV3.notify)(templateId, { dynamicValues: {
      listingTitle: { text: request.listingTitle }, firstName: { text: request.firstName }, lastName: { text: request.lastName }, email: { text: request.email }, phone: { text: request.phone ?? '' }, message: { text: request.message ?? '' }, agentEmail: { text: agentEmail ?? '' }, ownerEmail: { text: ownerEmail },
    } });
  } catch (error) { console.error('Unable to send quote request notification.', error); }
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  for (const [entry, timestamp] of requestTimes) if (now - timestamp > WINDOW_MS) requestTimes.delete(entry);
  const previous = requestTimes.get(key);
  if (previous && now - previous < WINDOW_MS) return true;
  requestTimes.set(key, now);
  return false;
}

export async function getMemberId(): Promise<string | undefined> {
  try {
    const token = await auth.getTokenInfo();
    return token.active && token.subjectType === 'MEMBER' ? token.subjectId : undefined;
  } catch { return undefined; }
}

export async function createQuoteRequest(input: Record<string, unknown>, rateKey: string): Promise<QuoteRequest> {
  if (isRateLimited(rateKey)) throw new Error('Please wait before sending another request.');
  const listingId = text(input.listingId, 80);
  const firstName = text(input.firstName, 80);
  const lastName = text(input.lastName, 80);
  const requesterEmail = text(input.email, 160).toLowerCase();
  const requesterPhone = text(input.phone, 40);
  const message = richMessage(input.message);
  if (!listingId) throw new Error('A listing is required.');
  if (!firstName) throw new Error('First name is required.');
  if (!lastName) throw new Error('Last name is required.');
  if (!email(requesterEmail)) throw new Error('A valid email is required.');
  if (!requesterPhone || !phone(requesterPhone)) throw new Error('A valid phone number is required.');
  if (plainFromHtml(message).length > 2000) throw new Error('Keep the message under 2,000 characters.');
  const listing = await getPublicListing(listingId);
  if (!listing) throw new Error('This property is no longer available.');

  const recent = await auth.elevate(items.query)(QUOTE_REQUESTS_COLLECTION_ID)
    .eq('listingId', listingId).eq('email', requesterEmail).ge('_createdDate', new Date(Date.now() - WINDOW_MS)).limit(1).find();
  if (recent.items.length > 0) throw new Error('You already sent a request for this property recently.');

  const saved = await auth.elevate(items.insert)(QUOTE_REQUESTS_COLLECTION_ID, {
    listing: listingId,
    listingId,
    listingTitle: listing.title,
    listingPrice: listing.price,
    listingCurrency: listing.currency,
    listingCity: listing.city,
    listingAddress: listing.address?.formatted ?? listing.address?.address ?? '',
    listingPrimaryImage: listing.primaryImage ?? listing.gallery?.[0]?.url ?? '',
    firstName,
    lastName,
    email: requesterEmail,
    phone: requesterPhone,
    message,
    memberId: await getMemberId(),
    status: 'new',
    notes: '',
    archived: false,
  });
  const request = normalizeQuoteRequest(saved);
  await notifyQuoteRequest(request, listing.agentEmail);
  return request;
}

export function normalizeQuoteRequest(value: unknown): QuoteRequest {
  const item = record(value);
  return {
    _id: text(item._id, 100), listingId: text(item.listingId, 100), listingTitle: text(item.listingTitle, 200),
    listingPrice: typeof item.listingPrice === 'number' ? item.listingPrice : 0, listingCurrency: text(item.listingCurrency, 10),
    listingCity: text(item.listingCity, 120), listingAddress: text(item.listingAddress, 300), listingPrimaryImage: text(item.listingPrimaryImage, 500),
    firstName: text(item.firstName, 80), lastName: text(item.lastName, 80), email: text(item.email, 160), phone: text(item.phone, 40), message: richMessage(item.message), memberId: text(item.memberId, 100),
    status: status(item.status), notes: text(item.notes, 4000), archived: item.archived === true, _createdDate: date(item._createdDate), _updatedDate: date(item._updatedDate),
  };
}

export async function queryQuoteRequests(page: number, pageSize: number, search: string, requestStatus?: QuoteRequestStatus, includeArchived = false) {
  let query = auth.elevate(items.query)(QUOTE_REQUESTS_COLLECTION_ID);
  if (search) query = query.contains('listingTitle', search);
  if (requestStatus) query = query.eq('status', requestStatus);
  if (!includeArchived) query = query.eq('archived', false);
  const result = await query.descending('_createdDate').skip(Math.max(0, page) * pageSize).limit(pageSize).find({ returnTotalCount: true });
  return { items: result.items.map(normalizeQuoteRequest), totalCount: result.totalCount ?? result.items.length, hasNext: result.hasNext() };
}

export async function updateQuoteRequest(id: string, input: Record<string, unknown>): Promise<QuoteRequest> {
  const existing = await auth.elevate(items.get)(QUOTE_REQUESTS_COLLECTION_ID, id);
  if (!existing) throw new Error('Quote request not found.');
  const next = { ...existing, status: status(input.status ?? existing.status), notes: text(input.notes ?? existing.notes, 4000), archived: input.archived === true };
  return normalizeQuoteRequest(await auth.elevate(items.update)(QUOTE_REQUESTS_COLLECTION_ID, next));
}
