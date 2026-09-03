import type {
  AreaUnit,
  FurnishingStatus,
  ListingStatus,
  PropertyCondition,
  PropertyType,
  QuoteRequestStatus,
  RentalFrequency,
  TenureType,
  TransactionType,
} from "@/lib/listing-types";
import type { ListingCopyStyle } from "@/lib/ai-writer";
import type { AppPlanId } from "@/lib/pricing-plans";
import type { DashboardMessageKey } from "./messages-en";

export const STATUS_MESSAGE_KEYS: Record<ListingStatus, DashboardMessageKey> = {
  draft: "statusDraft",
  active: "statusActive",
  under_offer: "statusUnderOffer",
  sold: "statusSold",
  archived: "statusArchived",
};

export const TRANSACTION_MESSAGE_KEYS: Record<
  TransactionType,
  DashboardMessageKey
> = {
  sale: "transactionSale",
  rent: "transactionRent",
  lease: "transactionLease",
};

export const PROPERTY_TYPE_MESSAGE_KEYS: Record<
  PropertyType,
  DashboardMessageKey
> = {
  house: "typeHouse",
  apartment: "typeApartment",
  condo: "typeCondo",
  townhouse: "typeTownhouse",
  land: "typeLand",
  office: "typeOffice",
  retail: "typeRetail",
  industrial: "typeIndustrial",
  "mixed-use": "typeMixedUse",
  other: "typeOther",
};

export const AREA_UNIT_MESSAGE_KEYS: Record<AreaUnit, DashboardMessageKey> = {
  "sq ft": "areaSqFt",
  "sq m": "areaSqM",
  acres: "areaAcres",
};

export const CONDITION_MESSAGE_KEYS: Record<
  PropertyCondition,
  DashboardMessageKey
> = {
  new: "conditionNew",
  good: "conditionGood",
  needs_renovation: "conditionNeedsRenovation",
};

export const FURNISHING_MESSAGE_KEYS: Record<
  FurnishingStatus,
  DashboardMessageKey
> = {
  unfurnished: "furnishingUnfurnished",
  semi_furnished: "furnishingSemi",
  furnished: "furnishingFurnished",
};

export const TENURE_MESSAGE_KEYS: Record<TenureType, DashboardMessageKey> = {
  freehold: "tenureFreehold",
  leasehold: "tenureLeasehold",
};

export const RENTAL_MESSAGE_KEYS: Record<RentalFrequency, DashboardMessageKey> =
  {
    monthly: "rentalMonthly",
    yearly: "rentalYearly",
  };

export const QUOTE_STATUS_MESSAGE_KEYS: Record<
  QuoteRequestStatus,
  DashboardMessageKey
> = {
  new: "quoteStatusNew",
  contacted: "quoteStatusContacted",
  quoted: "quoteStatusQuoted",
  closed: "quoteStatusClosed",
};

export const PLAN_NAME_KEYS: Record<AppPlanId, DashboardMessageKey> = {
  basic: "planBasic",
  pro: "planPro",
  business: "planBusiness",
};

export const PLAN_SUMMARY_KEYS: Record<AppPlanId, DashboardMessageKey> = {
  basic: "planBasicSummary",
  pro: "planProSummary",
  business: "planBusinessSummary",
};

export const COPY_STYLE_KEYS: Record<
  ListingCopyStyle,
  { label: DashboardMessageKey; hint: DashboardMessageKey }
> = {
  professional: {
    label: "styleProfessional",
    hint: "styleProfessionalHint",
  },
  luxury: { label: "styleLuxury", hint: "styleLuxuryHint" },
  short: { label: "styleShort", hint: "styleShortHint" },
  seo: { label: "styleSeo", hint: "styleSeoHint" },
  social: { label: "styleSocial", hint: "styleSocialHint" },
};

const ENGLISH_BREAKDOWN_LABELS: Record<string, DashboardMessageKey> = {
  Draft: "statusDraft",
  Active: "statusActive",
  "Under offer": "statusUnderOffer",
  Sold: "statusSold",
  Archived: "statusArchived",
  "For sale": "transactionSale",
  "For rent": "transactionRent",
  "For lease": "transactionLease",
  House: "typeHouse",
  Apartment: "typeApartment",
  Condo: "typeCondo",
  Townhouse: "typeTownhouse",
  Land: "typeLand",
  Office: "typeOffice",
  Retail: "typeRetail",
  Industrial: "typeIndustrial",
  "Mixed-use": "typeMixedUse",
  Other: "typeOther",
};

export function breakdownLabelKey(label: string): DashboardMessageKey | null {
  return ENGLISH_BREAKDOWN_LABELS[label] ?? null;
}
