import { items } from '@wix/data';
import { auth } from '@wix/essentials';

import { EMAIL_TEMPLATES_COLLECTION_ID } from '../listing-types';
import {
  DEFAULT_QUOTE_CONFIRMATION_TEMPLATE,
  validateQuoteConfirmationTemplate,
  type QuoteConfirmationTemplate,
} from '../quote-email-template';

const QUOTE_CONFIRMATION_ID = 'quote-confirmation';

/** The site's saved confirmation template, or the default when none was saved (or it is invalid). */
export async function getQuoteConfirmationTemplate(): Promise<QuoteConfirmationTemplate> {
  try {
    const item = await auth.elevate(items.get)(EMAIL_TEMPLATES_COLLECTION_ID, QUOTE_CONFIRMATION_ID);
    if (!item) return DEFAULT_QUOTE_CONFIRMATION_TEMPLATE;
    return validateQuoteConfirmationTemplate(item).value ?? DEFAULT_QUOTE_CONFIRMATION_TEMPLATE;
  } catch (error) {
    console.error('Unable to load the quote confirmation email template.', error);
    return DEFAULT_QUOTE_CONFIRMATION_TEMPLATE;
  }
}

export async function saveQuoteConfirmationTemplate(template: QuoteConfirmationTemplate): Promise<QuoteConfirmationTemplate> {
  await auth.elevate(items.save)(EMAIL_TEMPLATES_COLLECTION_ID, { _id: QUOTE_CONFIRMATION_ID, ...template });
  return template;
}
