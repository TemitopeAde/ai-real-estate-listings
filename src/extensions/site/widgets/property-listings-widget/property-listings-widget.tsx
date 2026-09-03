import React, { useEffect, useMemo, useRef, useState, type FC } from "react";
import ReactDOM from "react-dom";
import reactToWebComponent from "react-to-webcomponent";
import { httpClient } from "@wix/essentials";
import { authentication } from "@wix/site-members";
import { location } from "@wix/site-location";
import { ArrowRight, Bath, BedDouble, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, MapPin, Ruler } from "lucide-react";

import { type Listing, type ListingPage, type ListingPriceRange } from "../../../../lib/listing-types";
import { showSiteToast } from "../../../../lib/site-toast";
import { DEFAULT_LISTING_WIDGET_CONFIG, DETAIL_PAGE_PATH, formatListingPrice, getImageUrls, getListingLocation, normalizeListingWidgetConfig, parseWidgetJson, type ListingWidgetConfig } from "../../../../lib/site-widget";
import { t, useResolvedWidgetLanguage, useResolvedWidgetLocale, widgetTextDirection, type WidgetLangCode } from "../../../../lib/widget-i18n";
import { useDebouncedValue } from "../use-debounced-value";
import { useWidgetFonts } from "../widget-fonts";
import { EMPTY_LISTING_FILTERS, ListingFiltersBar, usablePriceRange, type ListingFilters } from "./listing-filters";
import styles from "./property-listings-widget.module.css";

interface Props { config?: string; layout?: string; detailPagePath?: string; }
const FILTER_DEBOUNCE_MS = 400;
const apiOrigin = new URL(import.meta.url).origin;

function getConfig(props: Props): ListingWidgetConfig {
  const parsed = parseWidgetJson(props.config ?? null, DEFAULT_LISTING_WIDGET_CONFIG);
  return normalizeListingWidgetConfig({
    ...parsed,
    layout: props.layout === "carousel" || parsed.layout === "carousel" ? "carousel" : "grid",
    detailPagePath: props.detailPagePath?.trim() || parsed.detailPagePath || DETAIL_PAGE_PATH,
    gap: Math.max(0, Number(parsed.gap) || 24),
    cardRadius: Math.max(0, Number(parsed.cardRadius) || 18),
    contentPadding: Math.max(0, Number(parsed.contentPadding) || 20),
    cardBorderWidth: Math.max(0, Number(parsed.cardBorderWidth) || 0),
    cardShadow: parsed.cardShadow === "none" || parsed.cardShadow === "strong" ? parsed.cardShadow : "soft",
  });
}

async function loadListings(filters: ListingFilters, page: number, pageSize: number): Promise<ListingPage> {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.transactionType) params.set("transactionType", filters.transactionType);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Listings could not be loaded.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) throw new Error("Listings response was invalid.");
  const result = data as Partial<ListingPage>;
  return {
    items: result.items as Listing[],
    totalCount: typeof result.totalCount === "number" ? result.totalCount : 0,
    hasNext: result.hasNext === true,
  };
}

async function loadPriceRange(): Promise<ListingPriceRange | null> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?priceRange=1`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Price range could not be loaded.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") return null;
  const result = data as Partial<ListingPriceRange>;
  const minPrice = Number(result.minPrice);
  const maxPrice = Number(result.maxPrice);
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return null;
  return {
    minPrice,
    maxPrice,
    currency: typeof result.currency === "string" && result.currency ? result.currency : "USD",
  };
}

async function savedAction(action: "list" | "save" | "remove", listingId?: string): Promise<unknown> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, listingId }) });
  if (!response.ok) throw new Error(response.status === 401 ? "login-required" : "saved-failed");
  return response.json();
}

const ImageCarousel: FC<{ listing: Listing; ratio: ListingWidgetConfig["imageRatio"]; showImageControls: boolean; showImageDots: boolean; lang: WidgetLangCode }> = ({ listing, ratio, showImageControls, showImageDots, lang }) => {
  const images = getImageUrls(listing);
  const [index, setIndex] = useState(0);
  const current = images[index] ?? "";
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);
  return <div className={`${styles.imageFrame} ${styles[ratio]}`}>
    {current ? <img src={current} alt={listing.title} loading="lazy" /> : <div className={styles.imageFallback}>{t(lang, "propertyImage")}</div>}
    {images.length > 1 && showImageControls ? <>
      <button className={`${styles.iconButton} ${styles.previous}`} type="button" onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label={t(lang, "previousImage")}><ChevronLeft /></button>
      <button className={`${styles.iconButton} ${styles.next}`} type="button" onClick={(event) => { event.stopPropagation(); move(1); }} aria-label={t(lang, "nextImage")}><ChevronRight /></button>
      {showImageDots ? <div className={styles.dots} aria-label={t(lang, "imageCount", { current: index + 1, total: images.length })}>{images.map((image, imageIndex) => <span key={image} className={imageIndex === index ? styles.activeDot : ""} />)}</div> : null}
    </> : null}
  </div>;
};

const PropertyCard: FC<{ listing: Listing; config: ListingWidgetConfig; saved: boolean; lang: WidgetLangCode; locale: string; onSave: (listingId: string) => Promise<void> }> = ({ listing, config, saved, lang, locale, onSave }) => {
  const openDetails = async () => {
    const baseUrl = await location.baseUrl();
    const path = config.detailPagePath.replace(/^\/+|\/+$/g, "") || DETAIL_PAGE_PATH;
    await location.to(`${baseUrl.replace(/\/+$/, "")}/${path}?id=${encodeURIComponent(listing._id)}`);
  };
  return <article className={styles.card} style={{ borderRadius: `${config.cardRadius}px` }}>
    <button type="button" className={styles.saveButton} onClick={(event) => { event.stopPropagation(); void onSave(listing._id); }} aria-label={saved ? t(lang, "removeTitle", { title: listing.title }) : t(lang, "saveTitle", { title: listing.title })} aria-pressed={saved}>
      {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
    </button>
    <div className={styles.cardButton} role="link" tabIndex={0} onClick={() => void openDetails()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openDetails(); } }} aria-label={t(lang, "viewTitle", { title: listing.title })}>
      <ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} lang={lang} />
      <div className={styles.cardBody}>
        {config.showPrice ? <div className={styles.cardTopline}><strong>{formatListingPrice(listing, locale)}</strong></div> : null}
        <h3>{listing.title}</h3>
        {config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing, t(lang, "locationNotSet"))}</p> : null}
        {config.showMetadata ? <div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {t(lang, "bedroomsShort", { count: listing.bedrooms })}</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {t(lang, "bathroomsShort", { count: listing.bathrooms })}</span> : null}<span><Ruler /> {listing.area.toLocaleString(locale)} {listing.areaUnit}</span></div> : null}
        <span className={styles.detailsLink}>{t(lang, "viewProperty")} <ArrowRight /></span>
      </div>
    </div>
  </article>;
};

const ListingsGridSkeleton: FC<{ count: number; lang: WidgetLangCode }> = ({ count, lang }) => (
  <div className={styles.list} aria-label={t(lang, "loadingProperties")} aria-busy="true">
    {Array.from({ length: Math.max(1, count) }, (_, index) => (
      <article className={styles.skeletonCard} key={index}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonBody}>
          <span className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonHeading}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonText}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
        </div>
      </article>
    ))}
  </div>
);

const PagingControls: FC<{
  config: ListingWidgetConfig;
  page: number;
  totalPages: number;
  hasNext: boolean;
  loading: boolean;
  lang: WidgetLangCode;
  onLoadMore: () => void;
  onPageChange: (page: number) => void;
}> = ({ config, page, totalPages, hasNext, loading, lang, onLoadMore, onPageChange }) => {
  if (config.loadingMode === "infinite" || (config.loadingMode === "load-more" && !hasNext)) return null;
  const buttonStyle = {
    backgroundColor: config.controlBackgroundColor,
    color: config.controlTextColor,
    borderColor: config.controlBorderColor,
    borderRadius: `${config.controlBorderRadius}px`,
  };
  if (config.loadingMode === "load-more") return <div className={styles.pagingControls} style={{ justifyContent: config.controlAlignment, marginTop: `${config.controlSpacing}px` }}><button type="button" className={styles.pagingButton} style={buttonStyle} onClick={onLoadMore} disabled={loading} aria-busy={loading}>{loading ? t(lang, "loading") : config.loadMoreLabel}</button></div>;
  return <nav className={styles.pagingControls} style={{ justifyContent: config.controlAlignment, marginTop: `${config.controlSpacing}px` }} aria-label={t(lang, "pagination")}>
    <button type="button" className={styles.pagingButton} style={buttonStyle} onClick={() => onPageChange(page - 1)} disabled={page === 0 || loading} aria-label={config.previousLabel}>
      {config.showPaginationIcons ? <ChevronLeft aria-hidden="true" /> : null}{config.previousLabel}
    </button>
    <div className={styles.pageNumbers} aria-label={t(lang, "pageOf", { current: page + 1, total: totalPages })}>
      {Array.from({ length: totalPages }, (_, index) => <button key={index} type="button" className={`${styles.pageButton} ${index === page ? styles.currentPage : ""}`} style={index === page ? buttonStyle : undefined} onClick={() => onPageChange(index)} disabled={loading} aria-current={index === page ? "page" : undefined}>{index + 1}</button>)}
    </div>
    <button type="button" className={styles.pagingButton} style={buttonStyle} onClick={() => onPageChange(page + 1)} disabled={!hasNext || loading} aria-label={config.nextLabel}>
      {config.nextLabel}{config.showPaginationIcons ? <ChevronRight aria-hidden="true" /> : null}
    </button>
  </nav>;
};

const PropertyListings: FC<Props> = (props) => {
  const config = useMemo(() => getConfig(props), [props.config, props.detailPagePath, props.layout]);
  const lang = useResolvedWidgetLanguage(config.language);
  const locale = useResolvedWidgetLocale(lang);
  const dir = widgetTextDirection(lang);
  const dismissToast = t(lang, "dismissNotification");
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ListingFilters>(EMPTY_LISTING_FILTERS);
  const [priceRange, setPriceRange] = useState<ListingPriceRange | null>(null);
  const sliderRange = useMemo(() => usablePriceRange(priceRange, listings), [listings, priceRange]);
  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);
  const activeFilters = useMemo(() => ({
    ...debouncedFilters,
    search: config.showSearch ? debouncedFilters.search : "",
    transactionType: config.showTransactionFilter ? debouncedFilters.transactionType : "",
    propertyType: config.showPropertyTypeFilter ? debouncedFilters.propertyType : "",
    minPrice: config.showPriceFilter ? debouncedFilters.minPrice : "",
    maxPrice: config.showPriceFilter ? debouncedFilters.maxPrice : "",
    bedrooms: config.showBedroomsFilter ? debouncedFilters.bedrooms : "",
  }), [config, debouncedFilters]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestVersion = useRef(0);
  const savingIds = useRef(new Set<string>());
  useEffect(() => {
    void loadPriceRange().then(setPriceRange).catch((reason: unknown) => {
      console.error("Unable to load listing price range.", reason);
      setPriceRange(null);
    });
  }, []);
  useEffect(() => {
    const version = ++requestVersion.current;
    let mounted = true;
    setLoading(true);
    setLoadingMore(false);
    setPage(0);
    setHasNext(false);
    setError(null);
    void loadListings(activeFilters, 0, config.pageSize).then((data) => {
      if (!mounted || version !== requestVersion.current) return;
      setListings(data.items);
      setTotalCount(data.totalCount);
      setHasNext(data.hasNext);
      setLoading(false);
    }).catch((reason: unknown) => {
      console.error("Unable to load public listings.", reason);
      if (mounted && version === requestVersion.current) {
        setError(t(lang, "propertiesUnavailable"));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [activeFilters, config.pageSize, lang]);
  const loadPage = async (targetPage: number, replace: boolean) => {
    if (loadingMore || (!replace && !hasNext)) return;
    const version = replace ? ++requestVersion.current : requestVersion.current;
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const data = await loadListings(activeFilters, targetPage, config.pageSize);
      if (version !== requestVersion.current) return;
      setListings((current) => {
        if (replace) return data.items;
        const existing = new Set(current.map((listing) => listing._id));
        return [...current, ...data.items.filter((listing) => !existing.has(listing._id))];
      });
      setPage(targetPage);
      setTotalCount(data.totalCount);
      setHasNext(data.hasNext);
      setError(null);
    } catch (reason: unknown) {
      console.error("Unable to load another listings page.", reason);
      if (version === requestVersion.current) setError(t(lang, "moreUnavailable"));
    } finally {
      if (version === requestVersion.current) { setLoading(false); setLoadingMore(false); }
    }
  };
  useEffect(() => {
    if (config.loadingMode !== "infinite" || loading || !hasNext || !sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) void loadPage(page + 1, false); }, { rootMargin: "320px 0px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [config.loadingMode, hasNext, loading, page, activeFilters, config.pageSize, loadingMore]);
  useEffect(() => {
    void savedAction("list").then((result) => {
      const value = typeof result === "object" && result !== null ? result as { items?: Array<{ id?: string }> } : {};
      setSavedIds(new Set((value.items ?? []).flatMap((item) => item.id ? [item.id] : [])));
    }).catch(() => { /* Guests have no saved state until they authenticate. */ });
  }, []);
  const onSave = async (listingId: string) => {
    if (savingIds.current.has(listingId)) return;
    savingIds.current.add(listingId);
    const previousSaved = savedIds.has(listingId);
    const nextSaved = !previousSaved;
    setSavedIds((current) => {
      const next = new Set(current);
      if (nextSaved) next.add(listingId); else next.delete(listingId);
      return next;
    });
    try {
      if (nextSaved) {
        try { await savedAction("save", listingId); } catch (error) {
          if (!(error instanceof Error) || error.message !== "login-required") throw error;
          await authentication.promptLogin();
          await savedAction("save", listingId);
        }
      } else await savedAction("remove", listingId);
      window.dispatchEvent(new CustomEvent("saved-properties:changed", { detail: { listingId, saved: nextSaved } }));
      showSiteToast(nextSaved ? t(lang, "propertySaved") : t(lang, "propertyRemoved"), nextSaved ? t(lang, "savedFind") : t(lang, "removedFromList"), "success", dismissToast);
    } catch (error) {
      setSavedIds((current) => {
        const next = new Set(current);
        if (previousSaved) next.add(listingId); else next.delete(listingId);
        return next;
      });
      console.error("Unable to update saved property.", error);
      showSiteToast(error instanceof Error && error.message === "login-required" ? t(lang, "signInToSave") : t(lang, "couldNotUpdateSaved"), t(lang, "tryAgain"), "error", dismissToast);
    } finally {
      savingIds.current.delete(listingId);
    }
  };
  const updateFilter = (key: keyof ListingFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters(EMPTY_LISTING_FILTERS);
  const style = { "--listing-gap": `${config.gap}px`, "--listing-columns": String(config.columns), "--listing-tablet-columns": String(config.tabletColumns), "--listing-mobile-columns": String(config.mobileColumns), "--listing-background": config.backgroundColor, "--listing-card": config.cardColor, "--listing-text": config.textColor, "--listing-muted": config.mutedColor, "--listing-accent": config.accentColor, "--listing-filter-card": config.filterBackgroundColor, "--listing-filter-text": config.filterTextColor, "--listing-filter-border": config.filterBorderColor, "--listing-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--listing-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--listing-border-width": `${config.cardBorderWidth}px`, "--listing-border-color": config.cardBorderColor, "--listing-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)", font: config.bodyFont.font } as React.CSSProperties;
  Object.assign(style, fontStyles);
  if (error && listings.length === 0 && !loading) return <div className={`${styles.root} ${styles.message}`} style={style} lang={lang} dir={dir} role="alert">{error}</div>;
  return <section className={`${styles.root} ${config.layout === "carousel" ? styles.carouselLayout : styles.gridLayout}`} style={style} lang={lang} dir={dir} aria-label={config.title} aria-busy={loading}>
    {config.showHeader ? <header className={styles.header}><div><h2 style={{ font: config.titleFont.font }}>{config.title}</h2><p>{config.subtitle}</p></div></header> : null}
    <ListingFiltersBar filters={filters} config={config} priceRange={sliderRange} lang={lang} locale={locale} onChange={updateFilter} onReset={resetFilters} />
    {loading && !loadingMore ? <ListingsGridSkeleton count={config.columns} lang={lang} /> : listings.length === 0 ? <div className={styles.message}>{Object.values(filters).some(Boolean) ? t(lang, "noMatch") : t(lang, "noProperties")}</div> : <div className={styles.list}>{listings.map((listing) => <PropertyCard key={listing._id} listing={listing} config={config} saved={savedIds.has(listing._id)} lang={lang} locale={locale} onSave={onSave} />)}</div>}
    {loadingMore ? <div className={styles.inlineLoading} role="status" aria-live="polite">{t(lang, "loadingMore")}</div> : null}
    {error ? <div className={styles.inlineError} role="alert">{error}</div> : null}
    <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
    {listings.length > 0 && !(loading && !loadingMore) ? <PagingControls config={config} page={page} totalPages={Math.max(1, Math.ceil(totalCount / config.pageSize))} hasNext={hasNext} loading={loading || loadingMore} lang={lang} onLoadMore={() => void loadPage(page + 1, false)} onPageChange={(nextPage) => { if (nextPage >= 0 && nextPage < Math.ceil(totalCount / config.pageSize) && nextPage !== page) void loadPage(nextPage, true); }} /> : null}
  </section>;
};

export default reactToWebComponent(PropertyListings, React, ReactDOM as any, { props: { config: "string", layout: "string", detailPagePath: "string" } });
