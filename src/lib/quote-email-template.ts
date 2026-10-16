/**
 * The confirmation email sent to a visitor after they request a quote.
 * Site owners edit the subject and body in the dashboard; placeholders such as
 * {firstName} are filled in when the email is sent. Shared by the dashboard
 * (editor and preview) and the server (validation and sending).
 */

export interface QuoteConfirmationTemplate {
  enabled: boolean;
  subject: string;
  body: string;
}

export const QUOTE_TEMPLATE_PLACEHOLDERS = [
  "firstName",
  "lastName",
  "listingTitle",
  "listingPrice",
  "listingAddress",
  "siteName",
] as const;

export type QuoteTemplatePlaceholder = (typeof QUOTE_TEMPLATE_PLACEHOLDERS)[number];
export type QuoteTemplateValues = Record<QuoteTemplatePlaceholder, string>;

export const QUOTE_TEMPLATE_SUBJECT_MAX = 200;
export const QUOTE_TEMPLATE_BODY_MAX = 5000;

export const DEFAULT_QUOTE_CONFIRMATION_TEMPLATE: QuoteConfirmationTemplate = {
  enabled: true,
  subject: "We received your request for {listingTitle}",
  body: [
    "Hi {firstName},",
    "",
    "Thank you for your interest in {listingTitle} ({listingPrice}).",
    "",
    "We've received your quote request and will get back to you shortly. If you have any other questions in the meantime, just reply to this email.",
    "",
    "Best regards,",
    "{siteName}",
  ].join("\n"),
};

export const SAMPLE_QUOTE_TEMPLATE_VALUES: QuoteTemplateValues = {
  firstName: "Jane",
  lastName: "Doe",
  listingTitle: "Modern 3-Bed Family Home",
  listingPrice: "$450,000",
  listingAddress: "1204 Oak Ridge Dr, Austin",
  siteName: "Your site",
};

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/** Placeholders used in the text that aren't supported (e.g. a typo like {fistName}). */
export function unknownPlaceholders(text: string): string[] {
  const known = new Set<string>(QUOTE_TEMPLATE_PLACEHOLDERS);
  return [...new Set([...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]!))].filter(
    (name) => !known.has(name),
  );
}

/** Fills in {placeholders}; unknown ones are left as typed. Returns plain text (no HTML). */
export function renderQuoteTemplate(text: string, values: QuoteTemplateValues): string {
  return text.replace(PLACEHOLDER_PATTERN, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name as QuoteTemplatePlaceholder] : match,
  );
}

export function validateQuoteConfirmationTemplate(
  input: unknown,
): { value?: QuoteConfirmationTemplate; errors: Partial<Record<keyof QuoteConfirmationTemplate, string>> } {
  const errors: Partial<Record<keyof QuoteConfirmationTemplate, string>> = {};
  const source = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const enabled = source.enabled;
  const subject = typeof source.subject === "string" ? source.subject.replace(/[\r\n]+/g, " ").trim() : "";
  const body = typeof source.body === "string" ? source.body.replace(/\r\n?/g, "\n").trim() : "";

  if (typeof enabled !== "boolean") errors.enabled = "Choose whether the email is sent.";
  if (!subject) errors.subject = "Add a subject.";
  else if (subject.length > QUOTE_TEMPLATE_SUBJECT_MAX) errors.subject = `Keep the subject under ${QUOTE_TEMPLATE_SUBJECT_MAX} characters.`;
  else if (unknownPlaceholders(subject).length) errors.subject = `Unknown placeholder: {${unknownPlaceholders(subject)[0]}}.`;
  if (!body) errors.body = "Add a message.";
  else if (body.length > QUOTE_TEMPLATE_BODY_MAX) errors.body = `Keep the message under ${QUOTE_TEMPLATE_BODY_MAX} characters.`;
  else if (unknownPlaceholders(body).length) errors.body = `Unknown placeholder: {${unknownPlaceholders(body)[0]}}.`;

  return Object.keys(errors).length > 0
    ? { errors }
    : { value: { enabled: enabled as boolean, subject, body }, errors };
}
