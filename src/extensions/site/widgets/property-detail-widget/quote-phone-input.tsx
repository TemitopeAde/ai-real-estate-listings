import { useMemo } from "react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { isPhoneCountry } from "../../../../lib/quote-phone";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

interface Props {
  value: string;
  country: CountryCode;
  lang: WidgetLangCode;
  error?: string;
  onChange: (phone: string, country: CountryCode) => void;
}

export function QuotePhoneInput({ value, country, lang, error, onChange }: Props) {
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: "region" });
    return getCountries().map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [lang]);

  return (
    <fieldset className={styles.quotePhoneField}>
      <legend>{t(lang, "phone")} <span aria-hidden="true">*</span></legend>
      <div className={styles.quotePhoneControls} dir="ltr">
        <select
          name="phoneCountryCode"
          value={country}
          autoComplete="tel-country-code"
          aria-label={t(lang, "phoneCountryCode")}
          required
          onChange={(event) => {
            if (isPhoneCountry(event.target.value)) onChange(value, event.target.value);
          }}
        >
          {countries.map(({ code, name }) => (
            <option key={code} value={code}>{name} (+{getCountryCallingCode(code)})</option>
          ))}
        </select>
        <input
          type="tel"
          name="phone"
          autoComplete="tel-national"
          inputMode="tel"
          aria-label={t(lang, "phone")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "quote-phone-error" : undefined}
          required
          maxLength={40}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            const parsed = next.trim().startsWith("+") ? parsePhoneNumberFromString(next) : undefined;
            if (parsed?.country) onChange(parsed.nationalNumber, parsed.country);
            else onChange(next, country);
          }}
        />
      </div>
      {error ? <span id="quote-phone-error" className={styles.quoteFieldError} role="alert">{error}</span> : null}
    </fieldset>
  );
}
