import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolveBillingAccess } from '../src/lib/billing-access.ts';
import { createSubscriptionGuard } from '../src/lib/subscription-guard.ts';

const paid = (instanceId = 'site-a', extra = {}) => ({ instanceId, isFree: false,
  billing: { packageName: 'pro', ...extra } });

test('trial, conversion, cancellation, expiry, and reactivation follow current Wix status', () => {
  const trial = paid('site-a', { freeTrialInfo: { status: 'IN_PROGRESS' } });
  assert.equal(resolveBillingAccess(trial).accessStatus, 'trial');
  assert.equal(resolveBillingAccess(paid('site-a', { freeTrialInfo: { status: 'ENDED' } })).accessStatus, 'paid');
  assert.equal(resolveBillingAccess(paid('site-a', { autoRenewing: false })).hasAccess, true);
  const downgraded = resolveBillingAccess({ ...trial, isFree: true });
  assert.equal(downgraded.accessStatus, 'free');
  assert.equal(downgraded.planId, 'basic');
  assert.equal(resolveBillingAccess(paid('site-a', { autoRenewing: true })).hasAccess, true);
});

test('free installs get Basic; unrecognized paid packages fail closed; trial eligibility comes from Wix', () => {
  for (const value of [undefined, {}, { instanceId: 'a' }, paid('a', { packageName: 'unknown' }), paid('a', { packageName: 'basic' })]) {
    assert.equal(resolveBillingAccess(value).accessStatus, 'unavailable');
  }
  const free = resolveBillingAccess({ instanceId: 'a', isFree: true });
  assert.equal(free.hasAccess, true);
  assert.equal(free.planId, 'basic');
  assert.equal(resolveBillingAccess({ instanceId: 'a', isFree: true, freeTrialAvailable: true }).canStartTrial, true);
  assert.equal(resolveBillingAccess({ instanceId: 'a', isFree: true }).canStartTrial, false);
  assert.equal(resolveBillingAccess(paid('a', { packageName: 'business' })).planId, 'business');
});

test('guards never run protected reads or writes for inactive or unverifiable subscriptions', async () => {
  for (const status of ['inactive', 'unavailable']) {
    const guard = createSubscriptionGuard(async () => ({ hasAccess: false, accessStatus: status }), async () => null);
    const response = await guard(() => { assert.fail('Protected handler ran'); })({});
    assert.equal(response.status, status === 'inactive' ? 403 : 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), {
      code: status === 'inactive' ? 'subscription_required' : 'entitlement_unavailable',
      message: 'Listings are temporarily unavailable.',
    });
  }
});

test('dashboard authentication precedes billing, and a billing outage fails closed', async () => {
  const denied = createSubscriptionGuard(async () => assert.fail('Billing called before authentication'), async () => new Response(null, { status: 401 }));
  assert.equal((await denied(() => assert.fail('Handler called'), true)({})).status, 401);
  const failed = createSubscriptionGuard(async () => { throw new Error('offline'); }, async () => null);
  assert.equal((await failed(() => assert.fail('Handler called'))({})).status, 503);
});

test('each request rechecks billing: expiration and restoration need no event or server restart', async () => {
  let instance = paid();
  let reads = 0;
  const route = createSubscriptionGuard(async () => { reads++; return resolveBillingAccess(instance); }, async () => null)(() => new Response('protected'));
  assert.equal((await route({})).status, 200);
  instance = { instanceId: 'site-a', isFree: true };
  assert.equal((await route({})).status, 200);
  instance = { instanceId: 'site-a' };
  assert.equal((await route({})).status, 503);
  instance = paid();
  assert.equal((await route({})).status, 200);
  assert.equal(reads, 4);
});

test('concurrent site requests cannot reuse another site entitlement', async () => {
  const route = (instance) => createSubscriptionGuard(async () => resolveBillingAccess(instance), async () => null)(() => new Response('protected'));
  const [a, b] = await Promise.all([route(paid('a'))({}), route({ instanceId: 'b' })({})]);
  assert.equal(a.status, 200); assert.equal(b.status, 503);
});

test('every business route is guarded; only status routes are exempt', async () => {
  const files = await readdir(new URL('../src/pages/api/', import.meta.url), { recursive: true });
  for (const file of files.filter((f) => f.endsWith('.ts') && !f.endsWith('entitlement.ts'))) {
    const source = await readFile(new URL('../src/pages/api/' + file, import.meta.url), 'utf8');
    const exports = [...source.matchAll(/export const (GET|POST|PATCH|PUT|DELETE)\s*=\s*(\w+)/g)];
    assert.ok(exports.length, file);
    for (const entry of exports) assert.equal(entry[2], 'withSubscription', file);
    assert.doesNotMatch(source, /export const (GET|POST|PATCH|PUT|DELETE):/, file);
  }
});

test('visitor CMS permissions cannot bypass listing, enquiry, or saved-property guards', async () => {
  for (const name of ['listings', 'quote-requests', 'saved-properties']) {
    const source = await readFile(new URL(`../src/extensions/backend/data-collections/${name}.ts`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /item(?:Read|Insert|Update|Remove):\s*['"](?:ANYONE|SITE_MEMBER_AUTHOR)['"]/);
  }
});

test('duplicate and reordered lifecycle events observe current billing without changing it', async () => {
  const { observeSubscriptionEvent } = await import('../src/lib/subscription-observation.ts');
  const observations = [];
  const current = resolveBillingAccess(paid('a', { autoRenewing: true }));
  const event = { metadata: { instanceId: 'a' }, data: { operationTimeStamp: new Date('2025-01-01') } };
  for (const type of ['PlanReactivated', 'PaidPlanAutoRenewalCancelled', 'PaidPlanAutoRenewalCancelled']) {
    await observeSubscriptionEvent(type, event, async () => current, (value) => observations.push(value));
  }
  assert.equal(observations.length, 3);
  assert.ok(observations.every((entry) => entry.hasAccess && entry.billingStatus === 'paid' && entry.autoRenewing));
  assert.equal(current.hasAccess, true);
});

test('event scope mismatch and billing failures are rejected for retry', async () => {
  const { observeSubscriptionEvent } = await import('../src/lib/subscription-observation.ts');
  const event = { metadata: { instanceId: 'a' } };
  await assert.rejects(observeSubscriptionEvent('PaidPlanPurchased', event,
    async () => resolveBillingAccess(paid('b')), () => {}), /instance could not be verified/);
  await assert.rejects(observeSubscriptionEvent('PaidPlanPurchased', event,
    async () => resolveBillingAccess({ instanceId: 'a' }), () => {}), /Billing could not be verified/);
});

test('visible polling refreshes on focus and every minute, serializes requests, and cleans up', async () => {
  const { pollWhileVisible } = await import('../src/lib/poll-while-visible.ts');
  const fakeWindow = new EventTarget();
  const fakeDocument = new EventTarget();
  fakeDocument.visibilityState = 'visible';
  let interval, intervalCleared = false;
  fakeWindow.setInterval = (fn, delay) => { assert.equal(delay, 60000); interval = fn; return 1; };
  fakeWindow.clearInterval = () => { intervalCleared = true; };
  fakeWindow.setTimeout = () => 2;
  fakeWindow.clearTimeout = () => {};
  globalThis.window = fakeWindow;
  globalThis.document = fakeDocument;
  let calls = 0, resolveRequest, lastSignal;
  const stop = pollWhileVisible((signal) => {
    calls++; lastSignal = signal;
    return new Promise((resolve) => { resolveRequest = resolve; });
  });
  try {
    assert.equal(calls, 1);
    fakeWindow.dispatchEvent(new Event('focus'));
    assert.equal(calls, 1);
    resolveRequest(); await Promise.resolve(); await Promise.resolve();
    fakeDocument.visibilityState = 'hidden'; interval();
    assert.equal(calls, 1);
    fakeDocument.visibilityState = 'visible';
    fakeDocument.dispatchEvent(new Event('visibilitychange'));
    assert.equal(calls, 2);
    resolveRequest(); await Promise.resolve(); await Promise.resolve();
    interval(); assert.equal(calls, 3);
    stop(); assert.equal(lastSignal.aborted, true); assert.equal(intervalCleared, true);
    resolveRequest(); await Promise.resolve(); await Promise.resolve();
    fakeWindow.dispatchEvent(new Event('focus')); interval();
    assert.equal(calls, 3);
  } finally { stop(); delete globalThis.window; delete globalThis.document; }
});
