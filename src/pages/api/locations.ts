import type { APIRoute } from "astro";

import { requireDashboardAccess } from "@/lib/server/access";

const API_BASE = "https://countriesnow.space/api/v0.1";
const TIMEOUT_MS = 8000;

interface CountriesNowEnvelope<T> {
  error?: boolean;
  msg?: string;
  data?: T;
}

interface IsoCountry {
  name?: string;
  Iso2?: string;
  iso2?: string;
}

interface CountryState {
  name?: string;
  state_code?: string;
}

interface StatesPayload {
  name?: string;
  states?: CountryState[];
}

interface LocationCountry {
  code: string;
  name: string;
}

interface LocationOption {
  name: string;
  iso2?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unavailable(): Response {
  return json({ message: "Location data is temporarily unavailable." }, 502);
}

function iso2Code(value: IsoCountry): string | undefined {
  const code = value.Iso2 ?? value.iso2;
  return typeof code === "string" && /^[A-Za-z]{2}$/.test(code.trim())
    ? code.trim().toUpperCase()
    : undefined;
}

async function fetchCountriesNow<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    console.error("CountriesNow request failed.", path, response.status);
    throw new Error("CountriesNow request failed.");
  }
  const payload = (await response.json()) as CountriesNowEnvelope<T>;
  if (payload.error || payload.data === undefined) {
    console.error("CountriesNow returned an error.", path, payload.msg);
    throw new Error(payload.msg ?? "CountriesNow request failed.");
  }
  return payload.data;
}

async function loadCountries(): Promise<LocationCountry[]> {
  const data = await fetchCountriesNow<IsoCountry[]>("/countries/iso");
  if (!Array.isArray(data)) throw new Error("Invalid CountriesNow ISO payload.");
  return data
    .flatMap((country) => {
      const name = country.name?.trim();
      const code = iso2Code(country);
      return name && code ? [{ code, name }] : [];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function resolveCountryName(code: string): Promise<string | undefined> {
  const countries = await loadCountries();
  return countries.find((country) => country.code === code)?.name;
}

function normalizeStateCode(countryCode: string, stateCode: string): string {
  const code = stateCode.trim().toUpperCase();
  const prefix = `${countryCode}-`;
  return code.startsWith(prefix) ? code.slice(prefix.length) : code;
}

function normalizeStateLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+state$/, "");
}

function mapStates(
  countryCode: string,
  data: StatesPayload | CountryState[],
): LocationOption[] {
  const states = Array.isArray(data) ? data : data.states;
  if (!Array.isArray(states)) throw new Error("Invalid CountriesNow states payload.");
  return states.flatMap((state) => {
    const name = state.name?.trim();
    if (!name) return [];
    const rawCode = state.state_code?.trim();
    return rawCode
      ? [{ name, iso2: normalizeStateCode(countryCode, rawCode) }]
      : [{ name }];
  });
}

function matchingState(
  states: LocationOption[],
  value: string,
): LocationOption | undefined {
  const needle = normalizeStateLabel(value);
  if (!needle) return undefined;
  const suffix = needle.includes("-") ? needle.split("-").at(-1) : needle;
  return states.find((state) => {
    const code = state.iso2?.toLowerCase();
    return (
      code === needle ||
      (suffix !== undefined && code === suffix) ||
      normalizeStateLabel(state.name) === needle
    );
  });
}

export const GET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const country = url.searchParams.get("country")?.trim().toUpperCase();
  const state = url.searchParams.get("state")?.trim() ?? "";

  try {
    if (!country) return json(await loadCountries());
    if (!/^[A-Z]{2}$/.test(country))
      return json({ message: "A valid country ISO2 code is required." }, 400);

    const countryName = await resolveCountryName(country);
    if (!countryName)
      return json({ message: "The selected country could not be found." }, 404);

    const states = mapStates(
      country,
      await fetchCountriesNow<StatesPayload | CountryState[]>(
        "/countries/states",
        {
          method: "POST",
          body: JSON.stringify({ country: countryName }),
        },
      ),
    );

    if (!state) return json(states);

    const matched = matchingState(states, state);
    if (!matched)
      return json({ message: "The selected state could not be found." }, 404);

    const cities = await fetchCountriesNow<unknown>("/countries/state/cities", {
      method: "POST",
      body: JSON.stringify({ country: countryName, state: matched.name }),
    });
    if (!Array.isArray(cities))
      throw new Error("Invalid CountriesNow cities payload.");

    return json(
      cities.flatMap((city) =>
        typeof city === "string" && city.trim() ? [{ name: city.trim() }] : [],
      ),
    );
  } catch (error) {
    console.error("Unable to load location data.", error);
    return unavailable();
  }
};
