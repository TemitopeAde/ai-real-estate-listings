import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuoteRequestEmail, messageToPlainText } from '../src/lib/server/quote-email.ts';

const request = {
  _id: '3f2c9a10-7b1e-4c55-9d2a-0e8f1b6c4d21', listingId: 'l1', listingTitle: 'Modern 3-Bed <Home>',
  listingPrice: 450000, listingCurrency: 'USD', listingCity: 'Austin', listingAddress: '1204 Oak Ridge Dr',
  listingPrimaryImage: 'https://static.wixstatic.com/media/a.jpg',
  firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+1 512 555 0134',
  message: '<p>Is it still <strong>available</strong>?</p><p>Thanks &amp; regards</p>',
  status: 'new', archived: false,
};

test('email has the listing, the requester and the message as escaped plain text', () => {
  const { subject, html } = buildQuoteRequestEmail(request, { siteName: 'Oak Realty', dashboardUrl: 'https://manage.wix.com/dashboard/site-1' });
  assert.equal(subject, 'New quote request: Modern 3-Bed <Home>');
  assert.match(html, /Modern 3-Bed &lt;Home&gt;/);
  assert.match(html, /\$450,000/);
  assert.match(html, /1204 Oak Ridge Dr, Austin/);
  assert.match(html, /mailto:jane@example\.com/);
  assert.match(html, /tel:\+15125550134/);
  assert.match(html, /Is it still available\?<br>Thanks &amp; regards/);
  assert.match(html, /View in dashboard/);
  assert.match(html, /Oak Realty/);
});

test('visitor input cannot inject HTML, scripts or unsafe links', () => {
  const { html } = buildQuoteRequestEmail({
    ...request,
    firstName: '<img src=x onerror=alert(1)>',
    message: '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    listingPrimaryImage: 'javascript:alert(1)',
  }, { dashboardUrl: 'http://insecure.example' });
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /View in dashboard/);
  assert.match(html, /&lt;script&gt;/);
});

test('rich text becomes readable plain text', () => {
  assert.equal(messageToPlainText('<ul><li>Garden</li><li>Pool</li></ul>'), '• Garden\n• Pool');
  assert.equal(messageToPlainText('Line 1<br>Line 2'), 'Line 1\nLine 2');
  assert.equal(messageToPlainText(''), '');
});

import { buildRequesterConfirmationEmail } from '../src/lib/server/quote-email.ts';
import {
  DEFAULT_QUOTE_CONFIRMATION_TEMPLATE,
  renderQuoteTemplate,
  unknownPlaceholders,
  validateQuoteConfirmationTemplate,
} from '../src/lib/quote-email-template.ts';

test('requester confirmation fills placeholders from the owner template', () => {
  const { subject, html } = buildRequesterConfirmationEmail(request, DEFAULT_QUOTE_CONFIRMATION_TEMPLATE, { siteName: 'Oak Realty' });
  assert.equal(subject, 'We received your request for Modern 3-Bed <Home>');
  assert.match(html, /Hi Jane,/);
  assert.match(html, /Modern 3-Bed &lt;Home&gt; \(\$450,000\)/);
  assert.match(html, /Best regards,<br>Oak Realty/);
  assert.doesNotMatch(html, /\{firstName\}/);
});

test('owner-written template text is escaped, not run as HTML', () => {
  const { html } = buildRequesterConfirmationEmail(request, {
    enabled: true, subject: 'Hi {firstName}', body: '<script>alert(1)</script>\n<a href="https://evil.io">click</a>',
  });
  assert.doesNotMatch(html, /<script>|<a href="https:\/\/evil/);
  assert.match(html, /&lt;script&gt;/);
});

test('template validation catches empty fields, unknown placeholders and long text', () => {
  assert.deepEqual(validateQuoteConfirmationTemplate(DEFAULT_QUOTE_CONFIRMATION_TEMPLATE).errors, {});
  const bad = validateQuoteConfirmationTemplate({ enabled: 'yes', subject: '', body: 'Hi {fistName}' });
  assert.ok(bad.errors.enabled && bad.errors.subject);
  assert.match(bad.errors.body, /\{fistName\}/);
  assert.match(validateQuoteConfirmationTemplate({ enabled: true, subject: 'x', body: 'y'.repeat(5001) }).errors.body, /5000/);
  assert.equal(validateQuoteConfirmationTemplate({ enabled: false, subject: 'A\nB', body: 'ok' }).value.subject, 'A B');
  assert.deepEqual(unknownPlaceholders('{firstName} {nope} {nope}'), ['nope']);
  assert.equal(renderQuoteTemplate('{firstName} {nope}', { firstName: 'Jane' }), 'Jane {nope}');
});
