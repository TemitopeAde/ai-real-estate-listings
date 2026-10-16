import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  csvRowToListingBody,
  listingsToCsv,
  parseCsv,
  parseListingCsv,
  validateCsvRow,
  validateCsvRows,
  validateMergedListing,
} from '../src/lib/listing-csv.ts';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('parseCsv handles quotes, escaped quotes, embedded commas/newlines, CRLF and BOM', () => {
  const records = parseCsv('﻿a,b,c\r\n"x, y","say ""hi""","line1\nline2"\r\n\r\n');
  assert.deepEqual(records, [['a', 'b', 'c'], ['x, y', 'say "hi"', 'line1\nline2']]);
});

test('sample CSV parses with no errors and normalises labels to stored values', () => {
  const parsed = parseListingCsv(fixture('listings-sample.csv'));
  assert.deepEqual(parsed.fileErrors, []);
  assert.equal(parsed.rows.length, 3);
  const [house, apartment, office] = parsed.rows;
  assert.equal(apartment.transactionType, 'rent');
  assert.equal(apartment.propertyType, 'apartment');
  assert.equal(apartment.status, 'active');
  assert.equal(apartment.furnished, 'true');
  const { errors } = validateCsvRows(parsed.rows);
  assert.deepEqual(errors, [{}, {}, {}]);
  assert.equal(house.galleryImages.split('|').length, 3);
  assert.equal(office.id, '3f2c9a10-7b1e-4c55-9d2a-0e8f1b6c4d21');
});

test('create rows convert to typed bodies; primary image defaults to the first gallery URL', () => {
  const [, apartment] = parseListingCsv(fixture('listings-sample.csv')).rows;
  const body = csvRowToListingBody(apartment);
  assert.equal(body.price, 3500000);
  assert.equal(body.furnished, true);
  assert.deepEqual(body.amenities, ['Pool', 'Gym', '24h security']);
  assert.equal(body.primaryImage, 'https://static.wixstatic.com/media/abc123~mv2.jpg');
  assert.equal(body.gallery.length, 2);
  assert.equal(body.address.city, 'Lekki');
});

test('update rows omit empty cells so existing values (including images) are kept', () => {
  const [, , office] = parseListingCsv(fixture('listings-sample.csv')).rows;
  const body = csvRowToListingBody(office);
  assert.equal(body.price, 18000);
  assert.equal(body.status, 'under_offer');
  assert.ok(!('gallery' in body));
  assert.ok(!('primaryImage' in body));
  assert.ok(!('bedrooms' in body));
  assert.ok(!('description' in body));
});

test('error fixture flags each bad cell', () => {
  const parsed = parseListingCsv(fixture('listings-with-errors.csv'));
  const { errors } = validateCsvRows(parsed.rows);
  assert.match(errors[0].propertyType, /must be one of/);
  assert.match(errors[1].price, /cannot be negative/);
  assert.match(errors[2].galleryImages, /not a valid http\(s\) URL/);
  assert.match(errors[3].city, /required/);
  assert.match(errors[4].latitude, /between -90 and 90/);
  assert.match(errors[5].agentEmail, /valid email/);
  // An unknown id is valid client-side; the server dry-run reports it.
  assert.deepEqual(errors[6], {});
  assert.match(validateCsvRow({ ...parsed.rows[6], title: '' }).row, /no values to change/);
});

test('cross-field and file-level rules', () => {
  const base = parseListingCsv(fixture('listings-sample.csv')).rows[0];
  assert.match(validateCsvRow({ ...base, transactionType: 'rent', rentalFrequency: '' }).rentalFrequency, /required/);
  assert.match(validateCsvRow({ ...base, longitude: '' }).longitude, /together/);
  assert.match(validateCsvRow({ ...base, availabilityDate: '2026-02-30' }).availabilityDate, /real date/);
  assert.match(validateCsvRow({ ...base, bedrooms: '2.5' }).bedrooms, /whole number/);
  assert.equal(validateCsvRow({ ...base, bathrooms: '2.5' }).bathrooms, undefined);
  assert.match(validateCsvRow({ ...base, currency: 'US' }).currency, /three-letter/);
  const { errors, warnings } = validateCsvRows([base, base, { ...base, id: 'abc' }, { ...base, id: 'abc' }]);
  assert.equal(warnings[0].length, 1);
  assert.match(errors[2].id, /appears on rows 3, 4/);
  assert.deepEqual(validateMergedListing({ transactionType: 'lease' }), ['Rental frequency is required for rent and lease listings.']);
});

test('export round-trips through import, keeps phones and neutralises formulas', () => {
  const listing = {
    _id: 'abc-123', title: '=HYPERLINK("x")', transactionType: 'sale', propertyType: 'house', status: 'active',
    price: 1, currency: 'USD', area: 2, areaUnit: 'sq m', city: 'Austin', agentPhone: '+1 512 555 0134',
    longitude: -97.7, latitude: 30.2, amenities: ['Pool', 'Gym'],
    gallery: [{ url: 'https://static.wixstatic.com/a.jpg' }, { url: 'https://x.com/b.jpg' }],
    primaryImage: 'https://static.wixstatic.com/a.jpg',
  };
  const csv = listingsToCsv([listing]);
  assert.match(csv, /'=HYPERLINK/);
  const [row] = parseListingCsv(csv).rows;
  assert.equal(row.title, '=HYPERLINK("x")');
  assert.equal(row.agentPhone, '+1 512 555 0134');
  assert.equal(row.longitude, '-97.7');
  assert.equal(row.galleryImages, 'https://static.wixstatic.com/a.jpg|https://x.com/b.jpg');
  assert.equal(row.amenities, 'Pool|Gym');
});
