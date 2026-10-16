import test from 'node:test';
import assert from 'node:assert/strict';
import { createComparisonStore, readComparison } from '../src/lib/property-comparison.ts';

const item = (id) => ({ id, title: `Property ${id}`, image: '' });
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('comparison preserves selection order, rejects a fifth property, and allows replacing one', () => {
  const store = createComparisonStore('site');
  for (const id of ['a', 'b', 'c', 'd', 'e']) store.toggle(item(id));
  assert.deepEqual(store.getSnapshot().items.map((value) => value.id), ['a', 'b', 'c', 'd']);
  assert.equal(store.getSnapshot().limitReached, true);
  store.toggle(item('b'));
  store.toggle(item('e'));
  assert.deepEqual(store.getSnapshot().items.map((value) => value.id), ['a', 'c', 'd', 'e']);
  assert.equal(store.getSnapshot().limitReached, false);
});

test('comparison needs two properties and closes when fewer than two remain', () => {
  const store = createComparisonStore('site');
  store.toggle(item('a'));
  store.open();
  assert.equal(store.getSnapshot().open, false);
  store.toggle(item('b'));
  store.open();
  assert.equal(store.getSnapshot().open, true);
  store.remove('a');
  assert.equal(store.getSnapshot().open, false);
});

test('selection survives navigation but dialog state does not; sites keep independent selections', () => {
  const storage = memoryStorage();
  const first = createComparisonStore('site-a', storage);
  first.toggle(item('a')); first.toggle(item('b')); first.open();
  const nextPage = createComparisonStore('site-a', storage);
  assert.deepEqual(nextPage.getSnapshot().items.map((value) => value.id), ['a', 'b']);
  assert.equal(nextPage.getSnapshot().open, false);
  assert.equal(createComparisonStore('site-b', storage).getSnapshot().items.length, 0);
  nextPage.clear();
  assert.deepEqual(createComparisonStore('site-a', storage).getSnapshot().items, []);
});

test('corrupt or outdated browser storage cannot create duplicates or exceed the comparison limit', () => {
  for (const invalid of ['', 'broken', '{}', 'null']) assert.deepEqual(readComparison(invalid), []);
  const values = [null, 12, {}, { id: '' }, item('a'), item('a'), ...['b', 'c', 'd', 'e'].map(item)];
  assert.deepEqual(readComparison(JSON.stringify(values)).map((value) => value.id), ['a', 'b', 'c', 'd']);
});

test('comparison remains usable when browser storage is blocked and subscriptions clean up', () => {
  const storage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const store = createComparisonStore('site', storage);
  let notifications = 0;
  const unsubscribe = store.subscribe(() => { notifications++; });
  store.toggle(item('a'));
  assert.equal(notifications, 1);
  unsubscribe();
  store.toggle(item('b')); store.open();
  assert.equal(notifications, 1);
  assert.equal(store.getSnapshot().open, true);
});
