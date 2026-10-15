import type { APIRoute } from "astro";

import { requireDashboardAccess } from "@/lib/server/access";
import { getAppEntitlement, subscriptionError } from "@/lib/server/entitlement";

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  try {
    const entitlement = await getAppEntitlement();
    if (entitlement.accessStatus === "unavailable") return subscriptionError(entitlement) ?? new Response(null, { status: 503 });
    return new Response(JSON.stringify(entitlement), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to load app entitlement.", error);
    return new Response(
      JSON.stringify({ message: "Plan details could not be loaded." }),
      { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  }
};
