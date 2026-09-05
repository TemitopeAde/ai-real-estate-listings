import { createContext, useContext, type ReactNode } from "react";

import type { AppEntitlement } from "@/lib/entitlement";
import { APP_PLAN_LISTING_CAPS, featuresForPlan } from "@/lib/pricing-plans";

const fallbackEntitlement: AppEntitlement = {
  planId: "basic",
  packageName: "basic",
  instanceId: "",
  isTrial: false,
  canStartTrial: false,
  fullAccess: false,
  listingCap: APP_PLAN_LISTING_CAPS.basic,
  features: featuresForPlan("basic"),
  listingCount: 0,
  activeListingCount: 0,
  publicListingCount: 0,
};

const EntitlementContext = createContext<AppEntitlement | null>(null);

export function EntitlementProvider({
  value,
  children,
}: {
  value: AppEntitlement | null;
  children: ReactNode;
}) {
  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement(): AppEntitlement {
  return useContext(EntitlementContext) ?? fallbackEntitlement;
}
