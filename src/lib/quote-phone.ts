import { getCountries, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export function isPhoneCountry(value: string): value is CountryCode {
  return getCountries().some((country) => country === value);
}

export function normalizeQuotePhone(value: string, country?: CountryCode) {
  if (!/^[+()\d\s.-]+$/.test(value.trim())) return null;
  const parsed = parsePhoneNumberFromString(value, country);
  if (!parsed?.isPossible()) return null;
  return { phone: parsed.number, countryCode: parsed.country ?? country };
}
