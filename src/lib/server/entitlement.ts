import { getBillingAccess } from "./billing-access";
export { getBillingAccess } from "./billing-access";
import { subscriptionError } from "@/lib/subscription-guard";
export { subscriptionError } from "@/lib/subscription-guard";
import { items } from "@wix/data";
import { auth } from "@wix/essentials";

import {
  type AppEntitlement,
  type PublicListingAccess,
  listingCapForPlan,
  publicAccessFromFeatures,
  publicListingCount,
} from "@/lib/entitlement";
import {
  LISTINGS_COLLECTION_ID,
  type Listing,
  type ListingInput,
} from "@/lib/listing-types";
import {
  featuresForPlan,
  type AppPlanId,
  type PlanFeatureFlag,
} from "@/lib/pricing-plans";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function countListings(status?: "active"): Promise<number> {
  try {
    const query = auth.elevate(items.query)(LISTINGS_COLLECTION_ID);
    const counted = await (status
      ? query.eq("status", status)
      : query.ne("status", "archived")
    ).count();
    return typeof counted === "number" && counted >= 0 ? counted : 0;
  } catch (error) {
    console.error("Unable to count listings for entitlement.", error);
    return 0;
  }
}

export async function getAppEntitlement(): Promise<AppEntitlement> {
  const access = await getBillingAccess();
  const fullAccess = access.isTrial;
  const features = featuresForPlan(!access.hasAccess ? "basic" : fullAccess ? "business" : access.planId);
  const listingCap = access.hasAccess ? listingCapForPlan(access.planId, fullAccess) : 0;
  const [listingCount, activeListingCount] = access.hasAccess
    ? await Promise.all([countListings(), countListings("active")]) : [0, 0];
  return {
    ...access, fullAccess, features, listingCap, listingCount, activeListingCount,
    publicListingCount: publicListingCount(activeListingCount, listingCap),
  };
}


export class ListingLimitError extends Error {
  readonly code = "listing_cap_reached";
  readonly status = 403;

  constructor(
    readonly planId: AppPlanId,
    readonly listingCap: number,
    readonly listingCount: number,
  ) {
    super(
      `Your plan allows up to ${listingCap} ${listingCap === 1 ? "listing" : "listings"}. Upgrade to add more.`,
    );
    this.name = "ListingLimitError";
  }
}

export function assertCanCreateListing(entitlement: AppEntitlement): void {
  if (entitlement.listingCap === null) return;
  if (entitlement.listingCount < entitlement.listingCap) return;
  throw new ListingLimitError(
    entitlement.planId,
    entitlement.listingCap,
    entitlement.listingCount,
  );
}

export class ListingEditError extends Error {
  readonly code = "upgrade_required";
  readonly status = 403;

  constructor(readonly planId: AppPlanId) {
    super("Editing listings is available on Pro and Business.");
    this.name = "ListingEditError";
  }
}

export function isArchiveOnlyPatch(patch: Partial<ListingInput>): boolean {
  const keys = Object.keys(patch);
  return keys.length === 1 && patch.status === "archived";
}

export function isViewMetricsPatch(patch: Partial<ListingInput>): boolean {
  const keys = Object.keys(patch);
  return (
    keys.length > 0 &&
    keys.every((key) => key === "viewCount" || key === "viewEvents")
  );
}

export function assertCanEditListing(
  entitlement: AppEntitlement,
  patch: Partial<ListingInput>,
): void {
  if (entitlement.features.editListings) return;
  if (isArchiveOnlyPatch(patch) || isViewMetricsPatch(patch)) return;
  throw new ListingEditError(entitlement.planId);
}

export async function requireFeature(
  feature: PlanFeatureFlag,
  message: string,
): Promise<{ entitlement: AppEntitlement; error: Response | null }> {
  const entitlement = await getAppEntitlement();
  const denied = subscriptionError(entitlement);
  if (denied) return { entitlement, error: denied };
  if (entitlement.features[feature]) {
    return { entitlement, error: null };
  }
  return {
    entitlement,
    error: json(
      {
        message,
        code: "upgrade_required",
        planId: entitlement.planId,
      },
      403,
    ),
  };
}

export function publicAccessFor(
  entitlement: AppEntitlement,
): PublicListingAccess {
  return publicAccessFromFeatures(entitlement.features);
}

export function applyPublicListingGates(
  listing: Listing,
  entitlement: AppEntitlement,
): Listing {
  const { viewEvents: _viewEvents, panoramaImage, panoramaImages, ...rest } =
    listing;
  const gated: Listing = { ...rest };

  if (!entitlement.features.virtualTour) {
    return gated;
  }

  const scenes = panoramaImages?.filter((image) => image.url.trim()) ?? [];
  const firstFallback = panoramaImage?.trim();
  const merged =
    firstFallback && !scenes.some((image) => image.url === firstFallback)
      ? [{ url: firstFallback }, ...scenes]
      : scenes;
  const visible = entitlement.features.multiSceneTour
    ? merged
    : merged.slice(0, 1);
  const first = visible[0];
  if (!first) return gated;

  gated.panoramaImages = visible;
  gated.panoramaImage = first.url;
  return gated;
}
