import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { parseFloorPlans, parseBrochures, moveAttachment, isAttachmentUrl } from '../src/lib/listing-attachments.ts';
import { createBrochureDownloadHandler } from '../src/lib/server/brochure-download.ts';
import { featuresForPlan, APP_PLAN_LISTING_CAPS, APP_PLAN_FEATURES } from '../src/lib/pricing-plans.ts';

// Transpile the real validator and resolve its extensionless imports for Node's test runner.
const validatorSource = (await readFile(new URL('../src/lib/server/listing-validation.ts', import.meta.url), 'utf8'))
  .replace('"../listing-attachments"', JSON.stringify(new URL('../src/lib/listing-attachments.ts', import.meta.url).href))
  .replace('"../listing-types"', JSON.stringify(new URL('../src/lib/listing-types.ts', import.meta.url).href));
const validatorJs = ts.transpileModule(validatorSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { parseListingPatch } = await import('data:text/javascript;base64,' + Buffer.from(validatorJs).toString('base64'));

const plan = { id: 'floor-1', url: 'https://static.wixstatic.com/media/floor.jpg', title: 'Ground floor' };
const brochure = { id: 'brochure-1', url: 'https://example.com/property.pdf', filename: 'Property.pdf', title: 'Property brochure' };
const request = (body) => new Request('https://example.com/api/public-listings/brochure-download', { method: 'POST', body: JSON.stringify(body) });

test('attachments are optional, preserve explicit clearing, labels and order through patch serialization', () => {
  assert.equal(parseFloorPlans(undefined, []), undefined);
  assert.equal(parseBrochures(undefined, []), undefined);
  const cleared = parseListingPatch({ floorPlans: [], brochures: [] });
  assert.deepEqual(cleared.errors, []);
  assert.deepEqual(JSON.parse(JSON.stringify(cleared.value)), { floorPlans: [], brochures: [] });
  const second = { ...plan, id: 'floor-2', url: 'https://example.com/second.png', title: 'First floor' };
  const patch = parseListingPatch({ floorPlans: [second, plan], brochures: [brochure] });
  assert.deepEqual(patch.errors, []);
  assert.deepEqual(patch.value.floorPlans, [second, plan]);
  assert.deepEqual(patch.value.brochures, [brochure]);
  assert.deepEqual(parseListingPatch({ title: 'Existing listing' }).value, { title: 'Existing listing' });
});

test('attachment validation rejects unsupported types and unsafe URLs, and deduplicates media', () => {
  for (const value of ['javascript:alert(1)', 'http://example.com/a.pdf', 'https://example.com/a.doc', 'https://user:pass@example.com/a.pdf']) {
    assert.equal(isAttachmentUrl(value, 'pdf'), false);
  }
  assert.ok(isAttachmentUrl('https://example.com/image.jpg/v1/fill/w_100/image.jpg', 'image'));
  assert.deepEqual(parseFloorPlans([plan, plan], []), [plan]);
  assert.deepEqual(parseBrochures([brochure, { ...brochure, title: 'Duplicate' }], []), [brochure]);
  for (const patch of [{ floorPlans: [brochure] }, { brochures: [plan] }, { brochures: null }, { floorPlans: 'bad' }, { brochures: [{ ...brochure, filename: 'file.doc' }] }]) {
    assert.ok(parseListingPatch(patch).errors.length);
  }
  assert.deepEqual(moveAttachment(['ground', 'upper', 'roof'], 1, -1), ['upper', 'ground', 'roof']);
  assert.deepEqual(moveAttachment(['ground', 'upper'], 0, -1), ['ground', 'upper']);
});

test('Basic editing is enabled without enabling paid features or increasing listing limits', () => {
  const basic = featuresForPlan('basic');
  assert.equal(basic.editListings, true);
  assert.equal(APP_PLAN_LISTING_CAPS.basic, 1);
  for (const [key, value] of Object.entries(basic)) if (key !== 'editListings') assert.equal(value, false, key);
  assert.equal(APP_PLAN_LISTING_CAPS.pro, 50);
  assert.equal(APP_PLAN_LISTING_CAPS.business, null);
  for (const name of ['Edit listings in the dashboard', 'Floor plans and PDF brochures']) {
    assert.deepEqual(APP_PLAN_FEATURES.find((feature) => feature.name === name).values, { basic: true, pro: true, business: true });
  }
});

test('download only generates a URL for the requested published listing attachment', async () => {
  const calls = [];
  const handler = createBrochureDownloadHandler({
    getListing: async (id) => id === 'published' ? { brochures: [brochure] } : null,
    generateDownload: async (document) => { calls.push(document); return 'https://download-files.wixmp.com/media/file.pdf?token=temporary'; },
  });
  for (const body of [{}, { listingId: 'published', fileId: 42 }, { listingId: 'archived', fileId: brochure.id }, { listingId: 'another-site', fileId: brochure.id }, { listingId: 'published', fileId: 'unattached-file' }]) {
    assert.ok([400, 404].includes((await handler(request(body))).status));
  }
  assert.equal(calls.length, 0);
  const response = await handler(request({ listingId: 'published', fileId: brochure.id }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match((await response.json()).url, /^https:\/\/download-files\.wixmp\.com/);
  assert.deepEqual(calls, [brochure]);
});

test('bad JSON and missing media never return a successful download response', async () => {
  const handler = createBrochureDownloadHandler({ getListing: async () => ({ brochures: [brochure] }), generateDownload: async () => { throw new Error('File deleted'); } });
  const invalid = new Request('https://example.com/download', { method: 'POST', body: '{bad' });
  assert.equal((await handler(invalid)).status, 400);
  const failed = await handler(request({ listingId: 'published', fileId: brochure.id }));
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('Cache-Control'), 'no-store');
});
