import React, { lazy, Suspense, useState, type FC } from "react";
import { httpClient } from "@wix/essentials";
import type { Listing } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import { QuotePhoneInput } from "./quote-phone-input";
import { normalizeQuotePhone } from "../../../../lib/quote-phone";
import type { CountryCode } from "libphonenumber-js";
import styles from "./property-detail-widget.module.css";

const QuoteMessageEditor = lazy(() =>
  import("./quote-message-editor").then((module) => ({ default: module.QuoteMessageEditor })),
);
const apiOrigin = new URL(import.meta.url).origin;
function plainFromHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

export const QuoteRequestModal: FC<{ listing: Listing; lang: WidgetLangCode; onClose: () => void }> = ({ listing, lang, onClose }) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("US");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError("");
  };

  const validate = () => {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.firstName.trim()) next.firstName = t(lang, "enterFirstName");
    if (!form.lastName.trim()) next.lastName = t(lang, "enterLastName");
    if (!form.email.trim()) next.email = t(lang, "enterEmail");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t(lang, "validEmail");
    }
    if (!form.phone.trim()) next.phone = t(lang, "enterPhone");
    else if (!normalizeQuotePhone(form.phone, phoneCountry)) {
      next.phone = t(lang, "validPhone");
    }
    if (plainFromHtml(form.message).length > 2000) next.message = t(lang, "messageTooLong");
    return next;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) {
      setError(t(lang, "fixFields"));
      return;
    }
    setSubmitting(true);
    const phoneDetails = normalizeQuotePhone(form.phone, phoneCountry);
    try {
      const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/quote-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing._id,
          ...form,
          phone: phoneDetails?.phone,
          phoneCountryCode: phoneDetails?.countryCode,
        }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? t(lang, "quoteFailed"));
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t(lang, "quoteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement> = {},
  ) => {
    const invalid = Boolean(fieldErrors[key]);
    const shared = {
      value: form[key],
      "aria-invalid": invalid,
      "aria-describedby": invalid ? `quote-${key}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        update(key, event.target.value);
      },
    };
    return (
      <label className={key === "message" ? styles.quoteMessage : undefined}>
        <span>{label} {props.required ? <span aria-hidden="true">*</span> : null}</span>
        {key === "message" ? <textarea rows={4} {...shared} /> : <input {...props} {...shared} />}
        {invalid ? (
          <span id={`quote-${key}-error`} className={styles.quoteFieldError} role="alert">
            {fieldErrors[key]}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div
      className={styles.quoteOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.quoteModal} role="dialog" aria-modal="true" aria-labelledby="quote-request-title">
        <button type="button" className={styles.quoteClose} onClick={onClose} aria-label={t(lang, "closeQuote")}>×</button>
        {success ? (
          <div className={styles.quoteSuccess}>
            <h2 id="quote-request-title">{t(lang, "requestReceived")}</h2>
            <p>{t(lang, "thankYouQuote", { title: listing.title })}</p>
            <button type="button" className={styles.quoteSubmit} onClick={onClose}>{t(lang, "done")}</button>
          </div>
        ) : (
          <>
            <h2 id="quote-request-title">{t(lang, "requestQuote")}</h2>
            <p className={styles.quoteIntro}>{t(lang, "quoteIntro", { title: listing.title })}</p>
            <form onSubmit={(event) => void submit(event)} noValidate>
              <div className={styles.quoteFields}>
                {field("firstName", t(lang, "firstName"), { name: "firstName", required: true, maxLength: 80, autoComplete: "given-name" })}
                {field("lastName", t(lang, "lastName"), { name: "lastName", required: true, maxLength: 80, autoComplete: "family-name" })}
                {field("email", t(lang, "email"), { name: "email", required: true, maxLength: 160, type: "email", inputMode: "email", autoComplete: "email" })}
                <QuotePhoneInput
                  value={form.phone}
                  country={phoneCountry}
                  lang={lang}
                  error={fieldErrors.phone}
                  onChange={(phone, country) => {
                    setPhoneCountry(country);
                    update("phone", phone);
                  }}
                />
                <label className={styles.quoteMessage}>
                  {t(lang, "message")}
                  <div
                    className={`${styles.quoteEditor}${fieldErrors.message ? ` ${styles.quoteEditorInvalid}` : ""}`}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "quote-message-error" : undefined}
                  >
                    <Suspense fallback={<div className={styles.quoteEditorFallback}>{t(lang, "loadingEditor")}</div>}>
                      <QuoteMessageEditor
                        value={form.message}
                        invalid={Boolean(fieldErrors.message)}
                        lang={lang}
                        onChange={(value) => update("message", value)}
                      />
                    </Suspense>
                  </div>
                  {fieldErrors.message ? (
                    <span id="quote-message-error" className={styles.quoteFieldError} role="alert">
                      {fieldErrors.message}
                    </span>
                  ) : null}
                </label>
              </div>
              {error ? <p className={styles.quoteError} role="alert">{error}</p> : null}
              <button type="submit" className={styles.quoteSubmit} disabled={submitting}>
                {submitting ? t(lang, "sending") : t(lang, "sendRequest")}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

