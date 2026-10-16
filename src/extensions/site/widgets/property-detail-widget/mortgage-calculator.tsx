import React, { useId, useState, type FC } from "react";
import { ChevronDown } from "lucide-react";

import type { Listing } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

const LOAN_TERMS = [10, 15, 20, 25, 30];
const DEFAULT_DOWN_PAYMENT = "20";
const DEFAULT_INTEREST_RATE = "6.5";
const DEFAULT_TERM = 30;

export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePct) || principal <= 0 || annualRatePct < 0 || years <= 0) return 0;
  const months = years * 12;
  const rate = annualRatePct / 12 / 100;
  if (rate === 0) return principal / months;
  const growth = (1 + rate) ** months;
  return (principal * rate * growth) / (growth - 1);
}

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale || undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString(locale || undefined)}`;
  }
}

export const MortgageCalculator: FC<{ listing: Listing; lang: WidgetLangCode; locale: string }> = ({ listing, lang, locale }) => {
  const id = useId();
  const [price, setPrice] = useState(String(listing.price));
  const [downPayment, setDownPayment] = useState(DEFAULT_DOWN_PAYMENT);
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [term, setTerm] = useState(DEFAULT_TERM);
  const homePrice = parseAmount(price);
  const downPaymentPct = Math.min(100, parseAmount(downPayment));
  const downPaymentAmount = homePrice * downPaymentPct / 100;
  const loanAmount = Math.max(0, homePrice - downPaymentAmount);
  const payment = monthlyPayment(loanAmount, parseAmount(interestRate), term);
  const decimalField = (key: string, label: string, value: string, onChange: (value: string) => void) => (
    <label className={styles.mortgageField} htmlFor={`${id}-${key}`}>
      <span>{label}</span>
      <input id={`${id}-${key}`} type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
  return <details className={`${styles.section} ${styles.mortgage}`}>
    <summary className={styles.mortgageSummary}>
      <h2>{t(lang, "mortgageCalculator")}</h2>
      <ChevronDown aria-hidden="true" />
    </summary>
    <div className={styles.mortgageBody}>
      <div className={styles.mortgageFields}>
        {decimalField("price", t(lang, "homePrice"), price, setPrice)}
        {decimalField("down", t(lang, "downPayment"), downPayment, setDownPayment)}
        {decimalField("rate", t(lang, "interestRate"), interestRate, setInterestRate)}
        <label className={styles.mortgageField} htmlFor={`${id}-term`}>
          <span>{t(lang, "loanTerm")}</span>
          <select id={`${id}-term`} value={term} onChange={(event) => setTerm(Number(event.target.value))}>
            {LOAN_TERMS.map((years) => <option key={years} value={years}>{t(lang, "years", { count: years })}</option>)}
          </select>
        </label>
      </div>
      <div className={styles.mortgageResult} aria-live="polite">
        <span>{t(lang, "monthlyPayment")}</span>
        <strong>{formatMoney(payment, listing.currency, locale)}</strong>
        <dl>
          <div><dt>{t(lang, "loanAmount")}</dt><dd>{formatMoney(loanAmount, listing.currency, locale)}</dd></div>
          <div><dt>{t(lang, "downPayment").replace(/\s*\(%\)$/, "")}</dt><dd>{formatMoney(downPaymentAmount, listing.currency, locale)}</dd></div>
        </dl>
      </div>
    </div>
    <p className={styles.mortgageDisclaimer}>{t(lang, "mortgageDisclaimer")}</p>
  </details>;
};
