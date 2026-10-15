import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { buildLifecycleSheetRecord, LIFECYCLE_EVENT_TYPES } from '../src/backend/lifecycle-sheet-record.ts';
import { getLifecycleSheetsConfig, deliverLifecycleSheetRecord } from '../src/backend/lifecycle-sheet-delivery.ts';

const receiver = await readFile(new URL('../scripts/google-sheets-lifecycle.gs', import.meta.url), 'utf8');
const event = {
  metadata: { instanceId: 'instance-a', accountInfo: { siteId: 'site-a', accountId: 'account-a' } },
  data: { operationTimeStamp: new Date('2026-10-14T10:00:00Z'), vendorProductId: 'pro',
    invoiceId: 'invoice-a', userReason: '=IMPORTXML("https://example.com")', extraField: 'preserved' },
};

// Field sets confirmed via Wix MCP ReadFullDocsMethodSchema for each SDK webhook.
const occurredAt = new Date('2026-10-14T10:00:00Z');
const expiresOn = new Date('2026-11-14T10:00:00Z');
const plan = { operationTimeStamp: occurredAt, vendorProductId: 'pro', cycle: 'MONTHLY' };
const lifecycleFixtures = [
  ['AppInstalled', { appId: 'app-a', originInstanceId: 'origin-a' },
    { appId: 'app-a', originInstanceId: 'origin-a', occurredAt: '', planId: '', invoiceId: '' }],
  ['AppRemoved', { appId: 'app-a' },
    { appId: 'app-a', occurredAt: '', expiresOn: '', planId: '' }],
  ['PaidPlanPurchased', { ...plan, expiresOn, couponName: 'welcome', invoiceId: 'invoice-a' },
    { couponName: 'welcome', invoiceId: 'invoice-a', expiresOn: expiresOn.toISOString() }],
  ['PaidPlanChanged', { ...plan, previousVendorProductId: 'basic', previousCycle: 'YEARLY', couponName: 'upgrade', invoiceId: 'invoice-b' },
    { previousPlanId: 'basic', previousBillingCycle: 'YEARLY', couponName: 'upgrade', invoiceId: 'invoice-b', expiresOn: '' }],
  ['PaidPlanAutoRenewalCancelled', { ...plan, cancelReason: 'USER_CANCEL', userReason: 'No longer needed', subscriptionCancellationType: 'USER_CANCEL', cancelledDuringFreeTrial: 'DURING_FREE_TRIAL' },
    { cancelReason: 'USER_CANCEL', userReason: 'No longer needed', cancellationType: 'USER_CANCEL', cancelledDuringFreeTrial: 'DURING_FREE_TRIAL', invoiceId: '' }],
  ['PlanConvertedToPaid', { ...plan, expiresOn },
    { expiresOn: expiresOn.toISOString(), invoiceId: '' }],
  ['PlanReactivated', { ...plan, expiresOn, invoiceId: 'invoice-c', reason: 'AUTO_RENEW_TURNED_ON' },
    { expiresOn: expiresOn.toISOString(), invoiceId: 'invoice-c', reactivationReason: 'AUTO_RENEW_TURNED_ON' }],
  ['PlanTransferred', { ...plan, invoiceId: 'invoice-d' },
    { invoiceId: 'invoice-d', expiresOn: '' }],
];

function createReceiver() {
  const sheets = new Map();
  let held = false;
  function createSheet(name) {
    const rows = [];
    sheets.set(name, rows);
    return {
    getLastRow: () => rows.length, getMaxRows: () => 1000, getMaxColumns: () => 40,
    setFrozenRows() {},
    getRange(start, column, count) {
      return {
        getValues: () => rows.slice(start - 1, start - 1 + count),
        setValues(values) {
          assert.ok(held, 'writes must hold the lock');
          values.forEach((row, i) => { rows[start - 1 + i] = row; });
        },
        createTextFinder(id) {
          assert.ok(held, 'duplicate checks must hold the lock');
          return { matchEntireCell() { return this; }, useRegularExpression() { return this; },
            findNext: () => rows.slice(start - 1, start - 1 + count).find((row) => row[column - 1] === id) };
        },
      };
    },
    };
  }
  const sheetObjects = new Map();
  const spreadsheet = {
    getSheetByName: (name) => sheetObjects.get(name),
    insertSheet(name) {
      assert.ok(held, 'tab creation must hold the lock');
      const sheet = createSheet(name);
      sheetObjects.set(name, sheet);
      return sheet;
    },
  };
  const context = vm.createContext({
    console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) =>
      ({ SPREADSHEET_ID: 'sheet-a', LIFECYCLE_WEBHOOK_SECRET: 'test-secret' })[key] }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (text) =>
      ({ setMimeType: () => JSON.parse(text) }) },
    SpreadsheetApp: { openById: () => spreadsheet, flush() {} },
    LockService: { getScriptLock: () => ({ waitLock() { assert.equal(held, false); held = true; },
      releaseLock() { held = false; } }) },
  });
  vm.runInContext(receiver, context);
  return { context, sheets, send: (record, secret = 'test-secret') => context.doPost({
    postData: { contents: JSON.stringify({ record, secret }) },
  }) };
}

test('retry IDs ignore snapshot changes and object key ordering; payload retains unknown fields', async () => {
  const first = await buildLifecycleSheetRecord('PaidPlanPurchased', event, null);
  const reordered = { data: event.data, metadata: event.metadata };
  const retry = await buildLifecycleSheetRecord('PaidPlanPurchased', reordered, {
    instance: { instanceId: 'instance-a', isFree: false, billing: { packageName: 'business', autoRenewing: false } },
  });
  assert.equal(first.eventId, retry.eventId);
  assert.equal(JSON.parse(first.payloadJson).data.extraField, 'preserved');
  assert.equal(first.snapshotStatus, 'unavailable');
  assert.equal(retry.autoRenewing, false);
  assert.equal(retry.isFree, false);
  assert.equal(retry.planId, 'pro');
  assert.equal(retry.currentPlanId, 'business');
  const different = await buildLifecycleSheetRecord('PaidPlanChanged', event, null);
  assert.notEqual(first.eventId, different.eventId);
});

test('receiver rejects unauthorized requests before creating or writing a sheet', async () => {
  const { send, sheets } = createReceiver();
  const record = await buildLifecycleSheetRecord('PaidPlanPurchased', event, null);
  assert.equal(send(record, 'wrong-secret').ok, false);
  assert.equal(sheets.size, 0);
  assert.equal(send({ ...record, eventType: 'Unknown' }).ok, false);
  assert.equal(sheets.size, 0);
});

test('receiver routes all eight lifecycle types to separate tabs, deduplicates retries, and escapes formulas', async () => {
  const { context, send, sheets } = createReceiver();
  assert.deepEqual(Array.from(context.LIFECYCLE_TYPES), [...LIFECYCLE_EVENT_TYPES]);
  for (const eventType of LIFECYCLE_EVENT_TYPES) {
    const record = await buildLifecycleSheetRecord(eventType, event, null);
    assert.equal(send(record).ok, true);
    assert.equal(send(record).duplicate, true);
    const rows = sheets.get(eventType);
    assert.equal(rows.length, 2);
    assert.equal(rows[1][1], eventType);
  }
  assert.equal(sheets.size, 8);
  const rows = sheets.get('AppInstalled');
  const reasonColumn = context.LIFECYCLE_COLUMNS.findIndex(([key]) => key === 'userReason');
  assert.equal(rows[1][reasonColumn], `'${event.data.userReason}`);
  const payloadColumn = context.LIFECYCLE_COLUMNS.findIndex(([key]) => key === 'payloadJson');
  assert.equal(JSON.parse(rows[1][payloadColumn]).data.extraField, 'preserved');
});

test('receiver rejects oversized values without partial writes or payload truncation', async () => {
  const { send, sheets } = createReceiver();
  const record = await buildLifecycleSheetRecord('AppRemoved', event, null);
  assert.equal(send({ ...record, userReason: 'x'.repeat(45001) }).ok, false);
  assert.equal(sheets.size, 0);
  assert.equal(send(record).ok, true);
});

test('setup creates all lifecycle tabs and repeated setup preserves their rows', async () => {
  const { context, send, sheets } = createReceiver();
  context.setupLifecycleSheet();
  assert.equal(sheets.size, 8);
  for (const rows of sheets.values()) assert.equal(rows.length, 1);
  const record = await buildLifecycleSheetRecord('PlanReactivated', event, null);
  assert.equal(send(record).ok, true);
  context.setupLifecycleSheet();
  assert.equal(sheets.get('PlanReactivated').length, 2);
  assert.equal(send(record).duplicate, true);
});

test('each Wix SDK payload maps its own fields into the correct tab and preserves full metadata', async () => {
  const { context, send, sheets } = createReceiver();
  for (const [eventType, data, expected] of lifecycleFixtures) {
    const envelope = { data, metadata: { instanceId: 'instance-a', eventType,
      accountInfo: { accountId: 'account-a', parentAccountId: 'parent-a', siteId: 'site-a' },
      identity: { identityType: 'WIX_USER', wixUserId: 'owner-a' } } };
    const record = await buildLifecycleSheetRecord(eventType, envelope, null);
    for (const [key, value] of Object.entries(expected)) assert.equal(record[key], value, `${eventType}: ${key}`);
    if (data.operationTimeStamp) {
      assert.equal(record.occurredAt, occurredAt.toISOString());
      assert.equal(record.planId, 'pro');
      assert.equal(record.billingCycle, 'MONTHLY');
    }
    assert.equal(send(record).ok, true);
    assert.equal(send(record).duplicate, true);
    const rows = sheets.get(eventType);
    assert.equal(rows.length, 2);
    for (const [index, [key]] of context.LIFECYCLE_COLUMNS.entries()) {
      assert.equal(rows[1][index], record[key], `${eventType}: saved ${key}`);
    }
    assert.deepEqual(JSON.parse(record.payloadJson), JSON.parse(JSON.stringify(envelope)));
  }
});

test('missing optional Wix fields save blanks, and missing site enrichment does not block removal', async () => {
  const { send } = createReceiver();
  for (const eventType of LIFECYCLE_EVENT_TYPES) {
    const record = await buildLifecycleSheetRecord(eventType, { data: {}, metadata: { instanceId: 'instance-a' } }, null);
    assert.equal(record.snapshotStatus, 'unavailable');
    for (const key of ['occurredAt', 'planId', 'expiresOn', 'ownerEmail', 'siteName', 'siteUrl', 'invoiceId']) {
      assert.equal(record[key], '', `${eventType}: ${key}`);
    }
    assert.equal(send(record).ok, true);
  }
});

test('current instance enrichment is distinct from event billing and normalizes SDK trial dates', async () => {
  const record = await buildLifecycleSheetRecord('PaidPlanChanged', { data: { ...plan, previousVendorProductId: 'basic' }, metadata: event.metadata }, {
    instance: { instanceId: 'instance-a', appName: 'AI Real Estate Listings', isFree: false,
      billing: { packageName: 'business', autoRenewing: false, freeTrialInfo: { status: 'ENDED', endDate: occurredAt } } },
    site: { siteId: 'site-a', siteDisplayName: 'My site', url: 'https://example.com', ownerInfo: { email: 'owner@example.com' } },
  });
  assert.equal(record.planId, 'pro');
  assert.equal(record.currentPlanId, 'business');
  assert.equal(record.previousPlanId, 'basic');
  assert.equal(record.freeTrialStatus, 'ENDED');
  assert.equal(record.freeTrialEndDate, occurredAt.toISOString());
  assert.equal(record.ownerEmail, 'owner@example.com');
  assert.equal(record.autoRenewing, false);
  assert.equal(record.isFree, false);
});

test('reinstalls and subsequent removals with the same Wix instance ID are retained', async () => {
  const { send, sheets } = createReceiver();
  for (const eventType of ['AppInstalled', 'AppRemoved']) {
    const envelope = { data: { appId: 'app-a' }, metadata: { instanceId: 'instance-a', eventType } };
    const first = await buildLifecycleSheetRecord(eventType, envelope, null);
    const later = await buildLifecycleSheetRecord(eventType, envelope, null);
    assert.notEqual(first.eventId, later.eventId);
    assert.equal(send(first).duplicate, false);
    assert.equal(send(first).duplicate, true);
    assert.equal(send(later).duplicate, false);
    assert.equal(sheets.get(eventType).length, 3);
  }
});

test('Sheets config reads runtime worker bindings and reports missing configuration', async () => {
  const environment = {
    LIFECYCLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/test-deployment/exec',
    LIFECYCLE_SHEETS_WEBHOOK_SECRET: 'test-secret',
  };
  assert.deepEqual(await getLifecycleSheetsConfig(async () => environment), {
    endpoint: environment.LIFECYCLE_SHEETS_WEBHOOK_URL, secret: 'test-secret',
  });
  await assert.rejects(getLifecycleSheetsConfig(async () => ({})), /server environment/);
  await assert.rejects(getLifecycleSheetsConfig(async () => ({ ...environment,
    LIFECYCLE_SHEETS_WEBHOOK_URL: 'https://example.com/exec' })), /deployed Google Apps Script/);
});

test('HTTP 200 only counts as successful delivery when the receiver acknowledges the write', async () => {
  const { send } = createReceiver();
  const record = await buildLifecycleSheetRecord('AppInstalled', { data: { appId: 'app-a' }, metadata: event.metadata }, null);
  const config = { endpoint: 'https://script.google.com/macros/s/test-deployment/exec', secret: 'test-secret' };
  const transport = async (url, options) => {
    assert.equal(url, config.endpoint);
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    return Response.json(send(body.record, body.secret));
  };
  const first = await deliverLifecycleSheetRecord(config, record, transport);
  assert.equal(first.duplicate, false);
  const retry = await deliverLifecycleSheetRecord(config, record, transport);
  assert.equal(retry.duplicate, true);
  await assert.rejects(deliverLifecycleSheetRecord({ ...config, secret: 'wrong' }, record, transport), /did not acknowledge/);
  await assert.rejects(deliverLifecycleSheetRecord(config, record, async () => new Response(null, { status: 403 })), /HTTP 403/);
});
