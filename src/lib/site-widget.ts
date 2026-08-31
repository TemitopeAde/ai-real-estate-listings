import type { Listing } from "./listing-types";

export const LISTINGS_COLLECTION_ID = "@admin14744/ai-real-estate-listings/listings";
export const DETAIL_PAGE_PATH = "property-details";

export interface WidgetFont {
  font: string;
  textDecoration?: string;
}

export function fontFamilyFromShorthand(value: string): string {
  const shorthand = value.trim();
  const sizeIndex = shorthand.search(/\b\d+(?:\.\d+)?(?:px|pt|pc|em|rem|%)(?:\/[^\s]+)?\s+/i);
  return sizeIndex >= 0 ? shorthand.slice(shorthand.indexOf(' ', sizeIndex) + 1).trim().split(',')[0]?.trim() ?? shorthand : shorthand;
}

export interface WidgetSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ListingWidgetConfig {
  layout: "grid" | "carousel";
  columns: number;
  gap: number;
  cardRadius: number;
  imageRatio: "landscape" | "square" | "portrait";
  showHeader: boolean;
  showLocation: boolean;
  showPrice: boolean;
  showStatus: boolean;
  showMetadata: boolean;
  title: string;
  subtitle: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  contentPadding: number;
  containerMargin: WidgetSpacing;
  containerPadding: WidgetSpacing;
  cardBorderWidth: number;
  cardBorderColor: string;
  cardShadow: "none" | "soft" | "strong";
  showImageControls: boolean;
  showImageDots: boolean;
  titleFont: WidgetFont;
  bodyFont: WidgetFont;
  detailPagePath: string;
}

export interface DetailWidgetConfig {
  cardRadius: number;
  imageRatio: "landscape" | "square" | "portrait";
  showLocation: boolean;
  showDescription: boolean;
  showAmenities: boolean;
  showAgent: boolean;
  showViewCount: boolean;
  titleFont: WidgetFont;
  bodyFont: WidgetFont;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  amenitiesTextColor: string;
  amenitiesBackgroundColor: string;
  contentPadding: number;
  containerMargin: WidgetSpacing;
  containerPadding: WidgetSpacing;
  cardBorderWidth: number;
  cardBorderColor: string;
  cardShadow: "none" | "soft" | "strong";
  showImageControls: boolean;
  showImageDots: boolean;
}

export const DEFAULT_LISTING_WIDGET_CONFIG: ListingWidgetConfig = {
  layout: "grid",
  columns: 3,
  gap: 24,
  cardRadius: 18,
  imageRatio: "landscape",
  showHeader: true,
  showLocation: true,
  showPrice: true,
  showStatus: true,
  showMetadata: true,
  title: "Featured properties",
  subtitle: "Explore available homes and spaces.",
  backgroundColor: "transparent",
  cardColor: "var(--wst-color-fill-background-secondary, #ffffff)",
  textColor: "var(--wst-color-text-primary, #17211b)",
  mutedColor: "var(--wst-color-text-secondary, #68736c)",
  accentColor: "var(--wst-color-action, #0c3b2e)",
  contentPadding: 20,
  containerMargin: { top: 0, right: 0, bottom: 0, left: 0 },
  containerPadding: { top: 20, right: 20, bottom: 20, left: 20 },
  cardBorderWidth: 0,
  cardBorderColor: "var(--wst-color-border, #dfe5e0)",
  cardShadow: "soft",
  showImageControls: true,
  showImageDots: true,
  titleFont: { font: "var(--wst-font-style-h2, 700 2rem Inter, sans-serif)" },
  bodyFont: { font: "var(--wst-font-style-paragraph, 400 1rem Inter, sans-serif)" },
  detailPagePath: DETAIL_PAGE_PATH,
};

export const DEFAULT_DETAIL_WIDGET_CONFIG: DetailWidgetConfig = {
  cardRadius: 20,
  imageRatio: "landscape",
  showLocation: true,
  showDescription: true,
  showAmenities: true,
  showAgent: true,
  showViewCount: true,
  titleFont: DEFAULT_LISTING_WIDGET_CONFIG.titleFont,
  bodyFont: DEFAULT_LISTING_WIDGET_CONFIG.bodyFont,
  backgroundColor: DEFAULT_LISTING_WIDGET_CONFIG.backgroundColor,
  cardColor: DEFAULT_LISTING_WIDGET_CONFIG.cardColor,
  textColor: DEFAULT_LISTING_WIDGET_CONFIG.textColor,
  mutedColor: DEFAULT_LISTING_WIDGET_CONFIG.mutedColor,
  accentColor: DEFAULT_LISTING_WIDGET_CONFIG.accentColor,
  amenitiesTextColor: DEFAULT_LISTING_WIDGET_CONFIG.accentColor,
  amenitiesBackgroundColor: "color-mix(in srgb, var(--detail-accent) 10%, transparent)",
  contentPadding: 24,
  containerMargin: { top: 0, right: 0, bottom: 0, left: 0 },
  containerPadding: { top: 24, right: 24, bottom: 24, left: 24 },
  cardBorderWidth: 0,
  cardBorderColor: DEFAULT_LISTING_WIDGET_CONFIG.cardBorderColor,
  cardShadow: "soft",
  showImageControls: true,
  showImageDots: true,
};

export function parseWidgetJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } as T : fallback;
  } catch {
    return fallback;
  }
}

export function getImageUrls(listing: Listing): string[] {
  const gallery = listing.gallery?.map((image) => image.url).filter(Boolean) ?? [];
  return [...new Set([listing.primaryImage, ...gallery].filter((url): url is string => Boolean(url)))];
}

export function formatListingPrice(listing: Listing): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: listing.currency }).format(listing.price);
  } catch {
    return `${listing.currency} ${listing.price.toLocaleString()}`;
  }
}

export function getListingLocation(listing: Listing): string {
  return [listing.address?.city, listing.address?.state, listing.address?.country].filter(Boolean).join(", ") || listing.city || "Location not set";
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
