import { createContext, useContext, type ReactNode } from "react";

import type { AppEntitlement } from "@/lib/entitlement";
import { featuresForPlan } from "@/lib/pricing-plans";

const fallbackEntitlement: AppEntitlement = {
  planId: "basic",
  packageName: "basic",
  instanceId: "",
  isTrial: false,
  isWixStaff: false,
  canStartTrial: false,
  fullAccess: false,
  listingCap: 10,
  features: featuresForPlan("basic"),
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
