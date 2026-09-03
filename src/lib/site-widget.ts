import type { Listing } from "./listing-types";
import { normalizeWidgetLanguage, type WidgetLanguageSetting } from "./widget-i18n";

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

export function fontSizeFromShorthand(value: string): string | undefined {
  const match = value.trim().match(/\b(\d+(?:\.\d+)?)(px|pt|pc|em|rem|%)\b/i);
  return match ? `${match[1]}${match[2]}` : undefined;
}

export interface WidgetSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ListingLoadingMode = "load-more" | "infinite" | "pagination";
export type ListingControlAlignment = "left" | "center" | "right";

export interface ListingWidgetConfig {
  layout: "grid" | "carousel";
  loadingMode: ListingLoadingMode;
  pageSize: number;
  loadMoreLabel: string;
  previousLabel: string;
  nextLabel: string;
  controlAlignment: ListingControlAlignment;
  controlSpacing: number;
  controlBackgroundColor: string;
  controlTextColor: string;
  controlBorderColor: string;
  controlBorderRadius: number;
  showPaginationIcons: boolean;
  columns: number;
  tabletColumns: number;
  mobileColumns: number;
  gap: number;
  cardRadius: number;
  imageRatio: "landscape" | "square" | "portrait";
  showHeader: boolean;
  showLocation: boolean;
  showPrice: boolean;
  showStatus: boolean;
  showMetadata: boolean;
  showSearch: boolean;
  showTransactionFilter: boolean;
  showPropertyTypeFilter: boolean;
  showPriceFilter: boolean;
  showBedroomsFilter: boolean;
  filterBackgroundColor: string;
  filterBorderColor: string;
  filterTextColor: string;
  filterRadius: number;
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
  language: WidgetLanguageSetting;
}

export interface DetailWidgetConfig {
  showFeaturedListings: boolean;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredCount: number;
  featuredShowLocation: boolean;
  featuredShowPrice: boolean;
  featuredShowStatus: boolean;
  featuredShowMetadata: boolean;
  featuredGap: number;
  cardRadius: number;
  imageRatio: "landscape" | "square" | "portrait";
  showLocation: boolean;
  showDescription: boolean;
  showAmenities: boolean;
  showAgent: boolean;
  showViewCount: boolean;
  showAiAssistant: boolean;
  showSocialShare: boolean;
  shareFacebookColor: string;
  shareInstagramColor: string;
  shareWhatsappColor: string;
  shareXColor: string;
  shareLinkedinColor: string;
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
  language: WidgetLanguageSetting;
}

export const DEFAULT_LISTING_WIDGET_CONFIG: ListingWidgetConfig = {
  layout: "grid",
  loadingMode: "load-more",
  pageSize: 12,
  loadMoreLabel: "Load more properties",
  previousLabel: "Previous",
  nextLabel: "Next",
  controlAlignment: "center",
  controlSpacing: 16,
  controlBackgroundColor: "var(--wst-color-action, #0c3b2e)",
  controlTextColor: "#ffffff",
  controlBorderColor: "var(--wst-color-action, #0c3b2e)",
  controlBorderRadius: 10,
  showPaginationIcons: true,
  columns: 3,
  tabletColumns: 2,
  mobileColumns: 1,
  gap: 24,
  cardRadius: 18,
  imageRatio: "landscape",
  showHeader: true,
  showLocation: true,
  showPrice: true,
  showStatus: true,
  showMetadata: true,
  showSearch: true,
  showTransactionFilter: true,
  showPropertyTypeFilter: true,
  showPriceFilter: true,
  showBedroomsFilter: true,
  filterBackgroundColor: "transparent",
  filterBorderColor: "var(--wst-color-border, #dfe5e0)",
  filterTextColor: "var(--wst-color-text-primary, #17211b)",
  filterRadius: 14,
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
  titleFont: { font: 'normal normal bold 28px "Helvetica Neue", Helvetica, Arial, sans-serif' },
  bodyFont: { font: 'normal normal normal 14px "Helvetica Neue", Helvetica, Arial, sans-serif' },
  detailPagePath: DETAIL_PAGE_PATH,
  language: "auto",
};

export const DEFAULT_DETAIL_WIDGET_CONFIG: DetailWidgetConfig = {
  showFeaturedListings: true,
  featuredTitle: "You may also like",
  featuredSubtitle: "Explore similar properties in the same area.",
  featuredCount: 4,
  featuredShowLocation: true,
  featuredShowPrice: true,
  featuredShowStatus: true,
  featuredShowMetadata: true,
  featuredGap: 20,
  cardRadius: 20,
  imageRatio: "landscape",
  showLocation: true,
  showDescription: true,
  showAmenities: true,
  showAgent: true,
  showViewCount: true,
  showAiAssistant: true,
  showSocialShare: true,
  shareFacebookColor: "#1877F2",
  shareInstagramColor: "#E4405F",
  shareWhatsappColor: "#25D366",
  shareXColor: "#17211B",
  shareLinkedinColor: "#0A66C2",
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
  language: "auto",
};

const PREVIOUS_DEFAULT_FILL = "var(--wst-color-fill-background-secondary, #ffffff)";
const PREVIOUS_DEFAULT_TITLE_FONT = "var(--wst-font-style-h2, 700 2rem Inter, sans-serif)";
const PREVIOUS_DEFAULT_BODY_FONTS = [
  "var(--wst-font-style-paragraph, 400 1rem Inter, sans-serif)",
  'normal normal normal 16px "Helvetica Neue", Helvetica, Arial, sans-serif',
];

function isPreviousDefaultFont(value: unknown, kind: "title" | "body"): boolean {
  if (typeof value !== "string") return false;
  return kind === "title"
    ? value === PREVIOUS_DEFAULT_TITLE_FONT || value.includes("--wst-font-style-h2")
    : PREVIOUS_DEFAULT_BODY_FONTS.includes(value) || value.includes("--wst-font-style-paragraph");
}

function withTransparentDefaultSurfaces<T extends object>(config: T): T {
  const record = config as T & { backgroundColor?: string; filterBackgroundColor?: string };
  return {
    ...record,
    ...(record.backgroundColor === PREVIOUS_DEFAULT_FILL ? { backgroundColor: "transparent" } : {}),
    ...(record.filterBackgroundColor === PREVIOUS_DEFAULT_FILL ? { filterBackgroundColor: "transparent" } : {}),
  };
}

function withHelveticaDefaultFonts<T extends object>(config: T): T {
  const record = config as T & { titleFont?: WidgetFont; bodyFont?: WidgetFont };
  return {
    ...record,
    ...(isPreviousDefaultFont(record.titleFont?.font, "title") ? { titleFont: DEFAULT_LISTING_WIDGET_CONFIG.titleFont } : {}),
    ...(isPreviousDefaultFont(record.bodyFont?.font, "body") ? { bodyFont: DEFAULT_LISTING_WIDGET_CONFIG.bodyFont } : {}),
  };
}

export function parseWidgetJson<T extends object>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? withHelveticaDefaultFonts(withTransparentDefaultSurfaces({ ...fallback, ...parsed } as T))
      : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeListingWidgetConfig(config: Partial<ListingWidgetConfig>): ListingWidgetConfig {
  const merged = { ...DEFAULT_LISTING_WIDGET_CONFIG, ...config };
  const loadingMode: ListingLoadingMode = merged.loadingMode === "infinite" || merged.loadingMode === "pagination" ? merged.loadingMode : "load-more";
  const controlAlignment: ListingControlAlignment = merged.controlAlignment === "left" || merged.controlAlignment === "right" ? merged.controlAlignment : "center";
  const spacing = (value: unknown, fallback: number, max: number) => Math.min(max, Math.max(0, Math.round(Number(value) || fallback)));
  const columns = Math.min(6, Math.max(1, spacing(merged.columns, DEFAULT_LISTING_WIDGET_CONFIG.columns, 6) || DEFAULT_LISTING_WIDGET_CONFIG.columns));
  const tabletColumns = Math.min(columns, Math.max(1, spacing(merged.tabletColumns, Math.min(2, columns), 4) || Math.min(2, columns)));
  const mobileColumns = Math.min(tabletColumns, Math.max(1, spacing(merged.mobileColumns, 1, 2) || 1));
  const label = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : fallback;
  return {
    ...merged,
    columns,
    tabletColumns,
    mobileColumns,
    loadingMode,
    pageSize: spacing(merged.pageSize, DEFAULT_LISTING_WIDGET_CONFIG.pageSize, 50) || DEFAULT_LISTING_WIDGET_CONFIG.pageSize,
    loadMoreLabel: label(merged.loadMoreLabel, DEFAULT_LISTING_WIDGET_CONFIG.loadMoreLabel),
    previousLabel: label(merged.previousLabel, DEFAULT_LISTING_WIDGET_CONFIG.previousLabel),
    nextLabel: label(merged.nextLabel, DEFAULT_LISTING_WIDGET_CONFIG.nextLabel),
    controlAlignment,
    controlSpacing: spacing(merged.controlSpacing, DEFAULT_LISTING_WIDGET_CONFIG.controlSpacing, 48),
    controlBorderRadius: spacing(merged.controlBorderRadius, DEFAULT_LISTING_WIDGET_CONFIG.controlBorderRadius, 40),
    showPaginationIcons: merged.showPaginationIcons !== false,
    language: normalizeWidgetLanguage(merged.language),
  };
}

export function normalizeDetailWidgetConfig(config: Partial<DetailWidgetConfig>): DetailWidgetConfig {
  return {
    ...DEFAULT_DETAIL_WIDGET_CONFIG,
    ...config,
    language: normalizeWidgetLanguage(config.language ?? DEFAULT_DETAIL_WIDGET_CONFIG.language),
  };
}

export function getImageUrls(listing: Listing): string[] {
  const gallery = listing.gallery?.map((image) => image.url).filter(Boolean) ?? [];
  return [...new Set([listing.primaryImage, ...gallery].filter((url): url is string => Boolean(url)))];
}

export function formatListingPrice(listing: Listing, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale || undefined, { style: "currency", currency: listing.currency }).format(listing.price);
  } catch {
    return `${listing.currency} ${listing.price.toLocaleString(locale || undefined)}`;
  }
}

export function getListingLocation(listing: Listing, fallback = "Location not set"): string {
  return [listing.address?.city, listing.address?.state, listing.address?.country].filter(Boolean).join(", ") || listing.city || fallback;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
