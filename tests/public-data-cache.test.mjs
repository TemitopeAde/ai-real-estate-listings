import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataCache } from '../src/lib/public-data-cache.ts';

const timing = { freshMs: 100, maxStaleMs: 1000 };
const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
    values,
  };
};
const setup = (scope = 'https://site-a.com') => {
  let clock = 0;
  const store = memoryStorage();
  const cache = createDataCache({ now: () => clock, storage: () => store, scope: () => scope });
  return { cache, store, tick: (ms) => { clock += ms; } };
};
const counter = (values) => {
  let calls = 0;
  const loader = async () => values[Math.min(calls++, values.length - 1)];
  return { loader, calls: () => calls };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('fresh entries are served without calling the API', async () => {
  const { cache, tick } = setup();
  const api = counter([{ price: 1 }]);
  assert.deepEqual(await cache.fetch('listing:1', api.loader, timing), { price: 1 });
  tick(50);
  assert.deepEqual(await cache.fetch('listing:1', api.loader, timing), { price: 1 });
  assert.equal(api.calls(), 1);
});

test('stale entries are returned at once and refreshed once in the background', async () => {
  const { cache, tick } = setup();
  const api = counter([{ price: 1 }, { price: 2 }]);
  await cache.fetch('listing:1', api.loader, timing);
  const heard = [];
  cache.subscribe('listing:1', { onValue: (value) => heard.push(value) });
  tick(200);
  const first = cache.fetch('listing:1', api.loader, timing);
  const second = cache.fetch('listing:1', api.loader, timing);
  assert.deepEqual(await first, { price: 1 });
  assert.deepEqual(await second, { price: 1 });
  await flush();
  assert.equal(api.calls(), 2);
  assert.deepEqual(heard, [{ price: 2 }]);
  assert.deepEqual(await cache.fetch('listing:1', api.loader, timing), { price: 2 });
});

test('a background refresh with unchanged data does not notify', async () => {
  const { cache, tick } = setup();
  const api = counter([{ price: 1 }]);
  await cache.fetch('k', api.loader, timing);
  let notified = 0;
  cache.subscribe('k', { onValue: () => notified++ });
  tick(200);
  await cache.fetch('k', api.loader, timing);
  await flush();
  assert.equal(notified, 0);
});

test('concurrent requests share one API call', async () => {
  const { cache } = setup();
  const api = counter([{ ok: true }]);
  const [a, b] = await Promise.all([cache.fetch('k', api.loader, timing), cache.fetch('k', api.loader, timing)]);
  assert.deepEqual(a, b);
  assert.equal(api.calls(), 1);
});

test('errors are never cached and background errors reach subscribers', async () => {
  const { cache, tick } = setup();
  let fail = true;
  const loader = async () => { if (fail) throw new Error('locked'); return { ok: true }; };
  await assert.rejects(cache.fetch('k', loader, timing), /locked/);
  fail = false;
  assert.deepEqual(await cache.fetch('k', loader, timing), { ok: true });
  const errors = [];
  cache.subscribe('k', { onError: (error) => errors.push(error.message) });
  fail = true;
  tick(200);
  await cache.fetch('k', loader, timing);
  await flush();
  assert.deepEqual(errors, ['locked']);
});

test('expired entries refetch, sessionStorage survives a reload, invalidate clears by prefix', async () => {
  const { cache, store, tick } = setup();
  const api = counter([{ v: 1 }, { v: 2 }]);
  await cache.fetch('listing:1', api.loader, timing);
  // A new cache instance on the same storage behaves like a page reload.
  const reloaded = createDataCache({ now: () => 50, storage: () => store, scope: () => 'https://site-a.com' });
  assert.deepEqual(reloaded.peek('listing:1', timing), { v: 1 });
  tick(5000);
  assert.deepEqual(await cache.fetch('listing:1', api.loader, timing), { v: 2 });
  cache.invalidate('listing:');
  assert.equal(cache.peek('listing:1', timing), undefined);
  assert.equal(store.length, 0);
});

test('sites never share entries and broken storage is ignored', async () => {
  const store = memoryStorage();
  let scope = 'https://me.wixsite.com/site-a';
  const cache = createDataCache({ now: () => 0, storage: () => store, scope: () => scope });
  await cache.fetch('listing:1', async () => 'A', timing);
  scope = 'https://me.wixsite.com/site-b';
  assert.equal(cache.peek('listing:1', timing), undefined);
  assert.equal(await cache.fetch('listing:1', async () => 'B', timing), 'B');

  const broken = createDataCache({ now: () => 0, storage: () => { throw new Error('SecurityError'); }, scope: () => 'x' });
  assert.equal(await broken.fetch('k', async () => 1, timing), 1);
  assert.equal(await broken.fetch('k', async () => 2, timing), 1);
});
