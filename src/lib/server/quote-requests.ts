import { contacts } from '@wix/crm';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { emailTransmissions } from '@wix/email-transmissions';

import { QUOTE_REQUESTS_COLLECTION_ID, QUOTE_REQUEST_STATUSES, type QuoteRequest, type QuoteRequestEmail, type QuoteRequestStatus } from '../listing-types';
import { getPublicListing } from './listings';
import { getAppEntitlement } from './entitlement';
import { normalizeRichText } from './listing-validation';
import { getSiteOwnerContact } from './site-owner';
import { buildQuoteRequestEmail, buildRequesterConfirmationEmail } from './quote-email';
import { getQuoteConfirmationTemplate } from './email-templates';
import { validateQuoteConfirmationTemplate } from '../quote-email-template';
import { isPhoneCountry, normalizeQuotePhone } from '../quote-phone';

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
function emailLog(value: unknown): QuoteRequestEmail[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): QuoteRequestEmail[] => {
    const item = record(entry);
    const sentAt = date(item.sentAt);
    return sentAt ? [{ sentAt, subject: text(item.subject, 200) }] : [];
  });
}
function date(value: unknown): Date | undefined { const result = value instanceof Date ? value : new Date(String(value ?? '')); return Number.isNaN(result.getTime()) ? undefined : result; }

/**
 * Email Transmissions metadata values must be 1-50 letters/digits (no hyphens),
 * so GUIDs are sent without their dashes and empty values are left out.
 */
function emailMetadata(request: QuoteRequest, kind: string): Record<string, string> {
  const clean = (value: string | undefined) => (value ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 50);
  const entries = { quoteRequestId: clean(request._id), listingId: clean(request.listingId), kind: clean(kind) };
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value));
}

/** Deterministic GUID per (request, purpose), so each email is sent at most once even if retried. */
async function emailIdempotencyKey(requestId: string, purpose: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${purpose}:${requestId}`)));
  const hex = [...digest.slice(0, 16)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Sends the quote request emails with the Wix Email Transmissions API:
 * a notification to the site owner, and the owner-edited confirmation to the requester.
 * Plan-gated (`quoteEmail`). Never throws: the quote request is already saved.
 */
async function sendQuoteRequestEmails(request: QuoteRequest): Promise<void> {
  let owner: Awaited<ReturnType<typeof getSiteOwnerContact>>;
  try {
    const entitlement = await getAppEntitlement();
    if (!entitlement.features.quoteEmail) return;
    owner = await getSiteOwnerContact();
  } catch (error) {
    console.error('Unable to prepare quote request emails.', error);
    return;
  }
  const send = auth.elevate(emailTransmissions.sendEmailTransmission);
  const requesterName = `${request.firstName} ${request.lastName}`.trim();

  // 1. Site owner: "New quote request". Replies go straight to the requester.
  const toOwner = async () => {
    if (!owner.email) { console.warn('Quote request email skipped: the site owner has no email address.'); return; }
    const { subject, html } = buildQuoteRequestEmail(request, {
      siteName: owner.siteName,
      dashboardUrl: owner.siteId ? `https://manage.wix.com/dashboard/${encodeURIComponent(owner.siteId)}` : undefined,
    });
    await send({
      type: 'TRANSACTIONAL',
      emailSubject: subject,
      emailHtmlContent: html,
      senderName: owner.siteName ?? 'Property listings',
      toRecipients: [{ emailAddress: owner.email, ...(owner.name ? { name: owner.name } : {}) }],
      replyTo: { emailAddress: request.email, name: requesterName },
      metadata: emailMetadata(request, 'ownerNotification'),
    }, { idempotencyKey: await emailIdempotencyKey(request._id, 'owner-notification') });
  };

  // 2. Requester: confirmation from the template the owner edits in the dashboard. Replies go to the owner.
  const toRequester = async () => {
    const template = await getQuoteConfirmationTemplate();
    if (!template.enabled) return;
    const { subject, html } = buildRequesterConfirmationEmail(request, template, { siteName: owner.siteName });
    await send({
      type: 'TRANSACTIONAL',
      emailSubject: subject,
      emailHtmlContent: html,
      senderName: owner.siteName ?? 'Property listings',
      toRecipients: [request.contactId ? { contactId: request.contactId } : { emailAddress: request.email, name: requesterName }],
      ...(owner.email ? { replyTo: { emailAddress: owner.email, ...(owner.name ? { name: owner.name } : {}) } } : {}),
      metadata: emailMetadata(request, 'requesterConfirmation'),
    }, { idempotencyKey: await emailIdempotencyKey(request._id, 'requester-confirmation') });
  };

  const results = await Promise.allSettled([toOwner(), toRequester()]);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Unable to send the quote request email to the ${index === 0 ? 'site owner' : 'requester'}.`, result.reason);
    }
  });
}

/** Links the submitter to a site contact, creating one if needed. Never blocks the quote request. */
async function upsertQuoteContact(details: { firstName: string; lastName: string; email: string; phone: string; countryCode?: string }): Promise<string | undefined> {
  try {
    const existing = await auth.elevate(contacts.queryContacts)().eq('primaryInfo.email', details.email).limit(1).find();
    if (existing.items[0]?._id) return existing.items[0]._id;
    const created = await auth.elevate(contacts.createContact)({
      name: { first: details.firstName, last: details.lastName },
      emails: { items: [{ email: details.email, primary: true }] },
      phones: { items: [{ phone: details.phone, ...(details.countryCode ? { countryCode: details.countryCode } : {}), primary: true }] },
    });
    return created.contact?._id;
  } catch (error) {
    console.error('Unable to save the quote requester as a contact.', error);
    return undefined;
  }
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
  const countryCode = text(input.phoneCountryCode, 10).toUpperCase();
  if (countryCode && !isPhoneCountry(countryCode)) throw new Error('A valid phone country code is required.');
  const normalizedPhone = normalizeQuotePhone(requesterPhone, isPhoneCountry(countryCode) ? countryCode : undefined);
  const message = richMessage(input.message);
  if (!listingId) throw new Error('A listing is required.');
  if (!firstName) throw new Error('First name is required.');
  if (!lastName) throw new Error('Last name is required.');
  if (!email(requesterEmail)) throw new Error('A valid email is required.');
  if (!requesterPhone || !phone(requesterPhone)) throw new Error('A valid phone number is required.');
  if (countryCode && !normalizedPhone) throw new Error('A valid phone number is required.');
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
    phone: normalizedPhone?.phone ?? requesterPhone,
    message,
    memberId: await getMemberId(),
    contactId: await upsertQuoteContact({ firstName, lastName, email: requesterEmail, phone: normalizedPhone?.phone ?? requesterPhone, countryCode: normalizedPhone?.countryCode }),
    status: 'new',
    notes: '',
    archived: false,
  });
  const request = normalizeQuoteRequest(saved);
  await sendQuoteRequestEmails(request);
  return request;
}

export function normalizeQuoteRequest(value: unknown): QuoteRequest {
  const item = record(value);
  return {
    _id: text(item._id, 100), listingId: text(item.listingId, 100), listingTitle: text(item.listingTitle, 200),
    listingPrice: typeof item.listingPrice === 'number' ? item.listingPrice : 0, listingCurrency: text(item.listingCurrency, 10),
    listingCity: text(item.listingCity, 120), listingAddress: text(item.listingAddress, 300), listingPrimaryImage: text(item.listingPrimaryImage, 500),
    firstName: text(item.firstName, 80), lastName: text(item.lastName, 80), email: text(item.email, 160), phone: text(item.phone, 40), message: richMessage(item.message), memberId: text(item.memberId, 100), contactId: text(item.contactId, 100),
    status: status(item.status), notes: text(item.notes, 4000), archived: item.archived === true, emailLog: emailLog(item.emailLog), _createdDate: date(item._createdDate), _updatedDate: date(item._updatedDate),
  };
}

export type QuoteRequestView = 'active' | 'archived' | 'all';

/** Requests for one view: `active` (not archived, the default), `archived`, or `all`. Search matches name, email and property. */
export async function queryQuoteRequests(page: number, pageSize: number, search: string, requestStatus?: QuoteRequestStatus, view: QuoteRequestView = 'active') {
  let query = auth.elevate(items.query)(QUOTE_REQUESTS_COLLECTION_ID);
  if (search) {
    query = query.and(
      items.filter().contains('listingTitle', search)
        .or(items.filter().contains('firstName', search))
        .or(items.filter().contains('lastName', search))
        .or(items.filter().contains('email', search.toLowerCase())),
    );
  }
  if (requestStatus) query = query.eq('status', requestStatus);
  if (view === 'active') query = query.eq('archived', false);
  if (view === 'archived') query = query.eq('archived', true);
  const result = await query.descending('_createdDate').skip(Math.max(0, page) * pageSize).limit(pageSize).find({ returnTotalCount: true });
  return { items: result.items.map(normalizeQuoteRequest), totalCount: result.totalCount ?? result.items.length, hasNext: result.hasNext() };
}

export type QuoteRequestCounts = Record<QuoteRequestStatus | 'active' | 'archived', number>;

/** Counts for the status tabs: each status among active requests, all active, and archived. */
export async function countQuoteRequests(): Promise<QuoteRequestCounts> {
  const count = (status?: QuoteRequestStatus, archived = false) => {
    let query = auth.elevate(items.query)(QUOTE_REQUESTS_COLLECTION_ID).eq('archived', archived);
    if (status) query = query.eq('status', status);
    return query.count();
  };
  const statuses = QUOTE_REQUEST_STATUSES.map((item) => item.value);
  const [active, archived, ...byStatus] = await Promise.all([count(), count(undefined, true), ...statuses.map((value) => count(value))]);
  return { active, archived, ...Object.fromEntries(statuses.map((value, index) => [value, byStatus[index] ?? 0])) } as QuoteRequestCounts;
}

export async function updateQuoteRequest(id: string, input: Record<string, unknown>): Promise<QuoteRequest> {
  const existing = await auth.elevate(items.get)(QUOTE_REQUESTS_COLLECTION_ID, id);
  if (!existing) throw new Error('Quote request not found.');
  const next = { ...existing, status: status(input.status ?? existing.status), notes: text(input.notes ?? existing.notes, 4000), archived: typeof input.archived === 'boolean' ? input.archived : existing.archived === true };
  return normalizeQuoteRequest(await auth.elevate(items.update)(QUOTE_REQUESTS_COLLECTION_ID, next));
}

export class QuoteReplyError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) { super(message); this.name = 'QuoteReplyError'; }
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sends an email from the site owner to a quote requester (Wix Email Transmissions),
 * logs it on the request and moves a "new" request to "contacted".
 */
export async function sendQuoteReply(id: string, input: Record<string, unknown>): Promise<QuoteRequest> {
  const parsed = validateQuoteConfirmationTemplate({ enabled: true, subject: input.subject, body: input.body });
  if (!parsed.value) throw new QuoteReplyError(Object.values(parsed.errors).join(' '), 422);
  const idempotencyKey = typeof input.idempotencyKey === 'string' && GUID.test(input.idempotencyKey) ? input.idempotencyKey : undefined;
  if (!idempotencyKey) throw new QuoteReplyError('A valid idempotency key is required.', 400);

  const entitlement = await getAppEntitlement();
  if (!entitlement.features.quoteEmail) throw new QuoteReplyError('Emailing requesters is available on Pro and Business plans.', 403, 'upgrade_required');

  const existing = await auth.elevate(items.get)(QUOTE_REQUESTS_COLLECTION_ID, id);
  if (!existing) throw new QuoteReplyError('Quote request not found.', 404);
  const request = normalizeQuoteRequest(existing);
  const owner = await getSiteOwnerContact();
  const { subject, html } = buildRequesterConfirmationEmail(request, parsed.value, { siteName: owner.siteName });

  await auth.elevate(emailTransmissions.sendEmailTransmission)({
    type: 'TRANSACTIONAL',
    emailSubject: subject,
    emailHtmlContent: html,
    senderName: owner.siteName ?? 'Property listings',
    toRecipients: [request.contactId ? { contactId: request.contactId } : { emailAddress: request.email, name: `${request.firstName} ${request.lastName}`.trim() }],
    ...(owner.email ? { replyTo: { emailAddress: owner.email, ...(owner.name ? { name: owner.name } : {}) } } : {}),
    metadata: emailMetadata(request, 'ownerReply'),
  }, { idempotencyKey });

  const log = [...(request.emailLog ?? []), { sentAt: new Date(), subject }].slice(-50);
  try {
    const updated = await auth.elevate(items.update)(QUOTE_REQUESTS_COLLECTION_ID, {
      ...existing,
      emailLog: log,
      status: request.status === 'new' ? 'contacted' : request.status,
    });
    return normalizeQuoteRequest(updated);
  } catch (error) {
    // The email went out; don't report a failure just because the log couldn't be saved.
    console.error('Quote reply sent, but the email log could not be saved.', error);
    return { ...request, emailLog: log };
  }
}
