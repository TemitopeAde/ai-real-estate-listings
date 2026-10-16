import test from 'node:test';
import assert from 'node:assert/strict';
import { toSitePath } from '../src/lib/site-navigation.ts';

test('toSitePath turns site URLs into the /page form Wix Location expects', () => {
  assert.equal(toSitePath('https://agency.com/property-details?id=1', 'https://agency.com'), '/property-details?id=1');
  assert.equal(toSitePath('https://agency.com/properties', 'https://agency.com/'), '/properties');
  assert.equal(toSitePath('https://agency.com', 'https://agency.com'), '/');
  // Free sites live under a path prefix.
  assert.equal(toSitePath('https://me.wixsite.com/estate/properties?page=2', 'https://me.wixsite.com/estate'), '/properties?page=2');
  assert.equal(toSitePath('https://me.wixsite.com/estate-other/x', 'https://me.wixsite.com/estate'), 'https://me.wixsite.com/estate-other/x');
  assert.equal(toSitePath('/property-details?id=2', 'https://agency.com'), '/property-details?id=2');
  assert.equal(toSitePath('https://evil.io/page', 'https://agency.com'), 'https://evil.io/page');
});
