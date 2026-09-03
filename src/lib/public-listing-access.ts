import type { PlanFeatureFlags } from "./pricing-plans";

export interface PublicListingAccess {
  virtualTour: boolean;
  multiSceneTour: boolean;
  socialShare: boolean;
  assistant: boolean;
  relatedListings: boolean;
}

export const LOCKED_PUBLIC_ACCESS: PublicListingAccess = {
  virtualTour: false,
  multiSceneTour: false,
  socialShare: false,
  assistant: false,
  relatedListings: false,
};

export function publicAccessFromFeatures(
  features: PlanFeatureFlags,
): PublicListingAccess {
  return {
    virtualTour: features.virtualTour,
    multiSceneTour: features.multiSceneTour,
    socialShare: features.socialShare,
    assistant: features.assistant,
    relatedListings: features.relatedListings,
  };
}
