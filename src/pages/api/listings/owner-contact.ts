import type { APIRoute } from "astro";

import { requireDashboardAccess } from "@/lib/server/access";
import { getSiteOwnerContact } from "@/lib/server/site-owner";

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  try {
    return new Response(JSON.stringify(await getSiteOwnerContact()), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unable to load site owner contact.", error);
    return new Response(
      JSON.stringify({ message: "Site owner contact is unavailable." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
