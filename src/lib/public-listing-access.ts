import type { PlanFeatureFlags } from "./pricing-plans";

export interface PublicListingAccess {
  virtualTour: boolean;
  multiSceneTour: boolean;
  socialShare: boolean;
  mortgageCalculator: boolean;
  assistant: boolean;
  relatedListings: boolean;
}

export const LOCKED_PUBLIC_ACCESS: PublicListingAccess = {
  virtualTour: false,
  multiSceneTour: false,
  socialShare: false,
  mortgageCalculator: false,
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
    mortgageCalculator: features.mortgageCalculator,
    assistant: features.assistant,
    relatedListings: features.relatedListings,
  };
}
