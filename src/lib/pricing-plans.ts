export type AppPlanId = "basic" | "pro" | "business";

export interface AppPlan {
  id: AppPlanId;
  name: string;
  price: string;
  billing: string;
  summary: string;
}

export type PlanFeatureValue = boolean | string;

export interface PlanFeatureRow {
  name: string;
  values: Record<AppPlanId, PlanFeatureValue>;
}

export const APP_PLANS: AppPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    billing: "Included with the app",
    summary: "Publish a small inventory and collect enquiries from the site.",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$6.50",
    billing: "per month",
    summary: "AI copy, 360° tours, visitor insights, and portfolio analytics.",
  },
  {
    id: "business",
    name: "Business",
    price: "$12",
    billing: "per month",
    summary: "Unlimited listings, on-site AI assistant, and full marketing tools.",
  },
];

export const APP_PLAN_IDS: AppPlanId[] = ["basic", "pro", "business"];

export const APP_PLAN_LISTING_CAPS: Record<AppPlanId, number | null> = {
  basic: 10,
  pro: 50,
  business: null,
};

export type PlanFeatureFlag =
  | "aiWriter"
  | "virtualTour"
  | "uniqueVisitors"
  | "analytics"
  | "socialShare"
  | "quoteEmail"
  | "assistant"
  | "relatedListings"
  | "multiSceneTour";

export type PlanFeatureFlags = Record<PlanFeatureFlag, boolean>;

export function isAppPlanId(value: string): value is AppPlanId {
  return APP_PLAN_IDS.some((id) => id === value);
}

export function featuresForPlan(planId: AppPlanId): PlanFeatureFlags {
  const paid = planId !== "basic";
  const business = planId === "business";
  return {
    aiWriter: paid,
    virtualTour: paid,
    uniqueVisitors: paid,
    analytics: paid,
    socialShare: paid,
    quoteEmail: paid,
    assistant: business,
    relatedListings: business,
    multiSceneTour: business,
  };
}

export const APP_PLAN_FEATURES: PlanFeatureRow[] = [
  {
    name: "Active listings",
    values: { basic: "Up to 10", pro: "Up to 50", business: "Unlimited" },
  },
  {
    name: "Listings and property detail widgets",
    values: { basic: true, pro: true, business: true },
  },
  {
    name: "Owner contact on listing pages",
    values: { basic: true, pro: true, business: true },
  },
  {
    name: "Quote request form",
    values: { basic: true, pro: true, business: true },
  },
  {
    name: "Saved properties for members",
    values: { basic: true, pro: true, business: true },
  },
  {
    name: "AI Listing Writer",
    values: { basic: false, pro: true, business: true },
  },
  {
    name: "360° virtual tour",
    values: { basic: false, pro: true, business: true },
  },
  {
    name: "Unique visitor insights",
    values: { basic: false, pro: true, business: true },
  },
  {
    name: "Portfolio analytics",
    values: { basic: false, pro: true, business: true },
  },
  {
    name: "Social sharing on listing pages",
    values: { basic: false, pro: true, business: true },
  },
  {
    name: "Quote request email notifications",
    values: { basic: false, pro: true, business: true },
  },
  {
    name: "On-site property AI assistant",
    values: { basic: false, pro: false, business: true },
  },
  {
    name: "Related listings on property pages",
    values: { basic: false, pro: false, business: true },
  },
  {
    name: "Multiple 360° tour scenes",
    values: { basic: false, pro: false, business: true },
  },
  {
    name: "Priority support",
    values: { basic: false, pro: false, business: true },
  },
];
