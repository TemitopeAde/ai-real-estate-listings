import test from 'node:test';
import assert from 'node:assert/strict';
import { isPhoneCountry, normalizeQuotePhone } from '../src/lib/quote-phone.ts';

test('quote phones combine the selected country with national numbers and remove local trunk prefixes', () => {
  assert.deepEqual(normalizeQuotePhone('020 7946 0018', 'GB'), { phone: '+442079460018', countryCode: 'GB' });
  assert.deepEqual(normalizeQuotePhone('(415) 555-2671', 'US'), { phone: '+14155552671', countryCode: 'US' });
  assert.deepEqual(normalizeQuotePhone('0803 123 4567', 'NG'), { phone: '+2348031234567', countryCode: 'NG' });
});

test('pasted international numbers keep their country and never get a second calling code', () => {
  assert.deepEqual(normalizeQuotePhone('+44 20 7946 0018', 'US'), { phone: '+442079460018', countryCode: 'GB' });
  assert.deepEqual(normalizeQuotePhone('+1 415 555 2671'), { phone: '+14155552671', countryCode: 'US' });
});

test('blank, incomplete and malformed phones are rejected before submission', () => {
  for (const value of ['', '    ', '+44', '123', '-------', 'call 4155552671', '+12345678901234567890']) {
    assert.equal(normalizeQuotePhone(value, 'US'), null, value);
  }
  assert.equal(isPhoneCountry('GB'), true);
  assert.equal(isPhoneCountry('NG'), true);
  assert.equal(isPhoneCountry('44'), false);
  assert.equal(isPhoneCountry('ZZ'), false);
});
