import type { APIRoute } from "astro";

import { requireDashboardAccess } from "@/lib/server/access";

const API_BASE = "https://api.countrystatecity.in/v1";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const country = url.searchParams.get("country")?.trim().toUpperCase();
  const state = url.searchParams.get("state")?.trim().toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country))
    return json({ message: "A valid country ISO2 code is required." }, 400);

  const path = state
    ? `/countries/${country}/states/${encodeURIComponent(state)}/cities`
    : `/countries/${country}/states`;
  const apiKey = import.meta.env.COUNTRYSTATEAPI;
  if (!apiKey) {
    console.error("COUNTRYSTATEAPI is not configured.");
    return json({ message: "Location data is temporarily unavailable." }, 503);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "X-CSCAPI-KEY": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("CountryStateCity request failed.", response.status);
      return json({ message: "Location data is temporarily unavailable." }, 502);
    }
    return json(await response.json());
  } catch (error) {
    console.error("Unable to load location data.", error);
    return json({ message: "Location data is temporarily unavailable." }, 502);
  }
};
