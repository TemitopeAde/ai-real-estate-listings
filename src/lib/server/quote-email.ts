import type { QuoteRequest } from "../listing-types";
import {
  renderQuoteTemplate,
  type QuoteConfirmationTemplate,
  type QuoteTemplateValues,
} from "../quote-email-template.ts";

/** Pure builder for the "new quote request" email sent to the site owner. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The stored message is sanitised rich text; emails get plain text with line breaks. */
export function messageToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString("en")}`;
  }
}

function safeHttpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export interface QuoteEmailContext {
  siteName?: string;
  /** Link to the site's dashboard, shown as a button when provided. */
  dashboardUrl?: string;
}

export function buildQuoteRequestEmail(
  request: QuoteRequest,
  context: QuoteEmailContext = {},
): { subject: string; html: string } {
  const name = `${request.firstName} ${request.lastName}`.trim();
  const subject = `New quote request: ${request.listingTitle}`.slice(0, 200);
  const message = messageToPlainText(request.message ?? "");
  const image = safeHttpsUrl(request.listingPrimaryImage);
  const dashboardUrl = safeHttpsUrl(context.dashboardUrl);
  const location = [request.listingAddress, request.listingCity].filter(Boolean).join(", ");

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#526057;font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#17211b;font-size:14px">${value}</td></tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr><td style="padding:24px 24px 8px">
    <p style="margin:0;color:#0c3b2e;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em">${escapeHtml(context.siteName || "Your site")}</p>
    <h1 style="margin:8px 0 0;color:#17211b;font-size:22px">New quote request</h1>
    <p style="margin:8px 0 0;color:#526057;font-size:14px">${escapeHtml(name)} asked about one of your properties.</p>
  </td></tr>
  <tr><td style="padding:16px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dfe5e2;border-radius:10px">
      <tr>
        ${image ? `<td width="120" style="padding:12px"><img src="${escapeHtml(image)}" width="108" alt="" style="display:block;width:108px;height:auto;border-radius:6px"></td>` : ""}
        <td style="padding:12px">
          <p style="margin:0;color:#17211b;font-size:16px;font-weight:bold">${escapeHtml(request.listingTitle)}</p>
          ${request.listingPrice ? `<p style="margin:4px 0 0;color:#0c3b2e;font-size:15px;font-weight:bold">${escapeHtml(formatPrice(request.listingPrice, request.listingCurrency))}</p>` : ""}
          ${location ? `<p style="margin:4px 0 0;color:#526057;font-size:13px">${escapeHtml(location)}</p>` : ""}
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 24px">
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${row("Name", escapeHtml(name))}
      ${row("Email", `<a href="mailto:${escapeHtml(encodeURIComponent(request.email).replace(/%40/g, "@"))}" style="color:#0c3b2e">${escapeHtml(request.email)}</a>`)}
      ${request.phone ? row("Phone", `<a href="tel:${escapeHtml(request.phone.replace(/[^\d+]/g, ""))}" style="color:#0c3b2e">${escapeHtml(request.phone)}</a>`) : ""}
    </table>
  </td></tr>
  ${message ? `<tr><td style="padding:16px 24px 0">
    <p style="margin:0 0 6px;color:#526057;font-size:14px">Message</p>
    <div style="padding:12px;border-radius:8px;background:#f4f6f5;color:#17211b;font-size:14px;line-height:1.5">${escapeHtml(message).replace(/\n/g, "<br>")}</div>
  </td></tr>` : ""}
  <tr><td style="padding:20px 24px 24px">
    ${dashboardUrl ? `<a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#0c3b2e;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none">View in dashboard</a>` : ""}
    <p style="margin:${dashboardUrl ? "16px" : "0"} 0 0;color:#526057;font-size:12px">Reply to this email to answer ${escapeHtml(request.firstName || "the visitor")} directly.</p>
  </td></tr>
</table>
</body></html>`;

  return { subject, html };
}

export function quoteTemplateValues(request: QuoteRequest, siteName?: string): QuoteTemplateValues {
  return {
    firstName: request.firstName,
    lastName: request.lastName,
    listingTitle: request.listingTitle,
    listingPrice: request.listingPrice ? formatPrice(request.listingPrice, request.listingCurrency) : "",
    listingAddress: [request.listingAddress, request.listingCity].filter(Boolean).join(", "),
    siteName: siteName || "our team",
  };
}

/** The visitor's confirmation email, from the owner-edited template. All text is escaped. */
export function buildRequesterConfirmationEmail(
  request: QuoteRequest,
  template: QuoteConfirmationTemplate,
  context: { siteName?: string } = {},
): { subject: string; html: string } {
  const values = quoteTemplateValues(request, context.siteName);
  const subject = renderQuoteTemplate(template.subject, values).replace(/[\r\n]+/g, " ").slice(0, 200);
  const body = renderQuoteTemplate(template.body, values);
  const image = safeHttpsUrl(request.listingPrimaryImage);
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 14px;color:#17211b;font-size:15px;line-height:1.6">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr><td style="padding:24px 24px 10px">${paragraphs}</td></tr>
  <tr><td style="padding:0 24px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dfe5e2;border-radius:10px">
      <tr>
        ${image ? `<td width="120" style="padding:12px"><img src="${escapeHtml(image)}" width="108" alt="" style="display:block;width:108px;height:auto;border-radius:6px"></td>` : ""}
        <td style="padding:12px">
          <p style="margin:0;color:#17211b;font-size:15px;font-weight:bold">${escapeHtml(request.listingTitle)}</p>
          ${values.listingPrice ? `<p style="margin:4px 0 0;color:#0c3b2e;font-size:14px;font-weight:bold">${escapeHtml(values.listingPrice)}</p>` : ""}
          ${values.listingAddress ? `<p style="margin:4px 0 0;color:#526057;font-size:13px">${escapeHtml(values.listingAddress)}</p>` : ""}
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  return { subject, html };
}
