import { useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countries = getCountries();
const callingCodes = [...new Set(countries.map((country) => getCountryCallingCode(country)))]
  .sort((a, b) => b.length - a.length);

function phoneParts(value: string, preferredCountry: CountryCode) {
  const phone = value.trim();
  if (!phone.startsWith("+")) return { country: preferredCountry, number: value };

  const digits = phone.replace(/\D/g, "");
  const code = callingCodes.find((callingCode) => digits.startsWith(callingCode));
  if (!code) return { country: preferredCountry, number: value };

  const parsed = parsePhoneNumberFromString(phone);
  const country = getCountryCallingCode(preferredCountry) === code
    ? preferredCountry
    : parsed?.country ?? countries.find((candidate) => getCountryCallingCode(candidate) === code) ?? preferredCountry;
  return { country, number: digits.slice(code.length) };
}

interface AgentPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry: string;
  locale: string;
  countryLabel: string;
  phoneLabel: string;
  invalid: boolean;
  errorId?: string;
}

export function AgentPhoneInput({
  value, onChange, defaultCountry, locale, countryLabel, phoneLabel, invalid, errorId,
}: AgentPhoneInputProps) {
  const [preferredCountry, setPreferredCountry] = useState<CountryCode>(() =>
    countries.find((country) => country === defaultCountry) ?? "US",
  );
  const { country, number } = phoneParts(value, preferredCountry);
  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return countries.map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [locale]);

  return (
    <div className="flex min-w-0 gap-2" dir="ltr">
      <Select
        value={country}
        onValueChange={(selected) => {
          const nextCountry = countries.find((candidate) => candidate === selected);
          if (!nextCountry) return;
          setPreferredCountry(nextCountry);
          onChange(number.trim() ? `+${getCountryCallingCode(nextCountry)} ${number}` : "");
        }}
      >
        <SelectTrigger className="shrink-0" aria-label={countryLabel}>
          <SelectValue>{country} +{getCountryCallingCode(country)}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.name} (+{getCountryCallingCode(option.code)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="min-w-0 flex-1"
        type="tel"
        autoComplete="tel-national"
        aria-label={phoneLabel}
        aria-invalid={invalid}
        aria-describedby={errorId}
        value={number}
        onChange={(event) => {
          const next = event.target.value;
          setPreferredCountry(country);
          onChange(next.trim() && !next.trim().startsWith("+")
            ? `+${getCountryCallingCode(country)} ${next}`
            : next);
        }}
        placeholder={phoneLabel}
      />
    </div>
  );
}
