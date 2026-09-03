import type { APIRoute } from "astro";

import { requireDashboardAccess } from "@/lib/server/access";
import { getAppEntitlement } from "@/lib/server/entitlement";

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  try {
    return new Response(JSON.stringify(await getAppEntitlement()), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unable to load app entitlement.", error);
    return new Response(
      JSON.stringify({ message: "Plan details could not be loaded." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
