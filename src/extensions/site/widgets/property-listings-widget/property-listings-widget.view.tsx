import { ComparisonScope } from '../../comparison/comparison-runtime';
import { ComparisonButton, ComparisonSpace } from '../../comparison/comparison-button';
import { usePropertyListings } from "./use-property-listings";
import React, { useMemo, useState, type FC } from "react";
import { location } from "@wix/site-location";
import { navigateTo } from "../../../../lib/site-navigation";
import { ArrowRight, Bath, BedDouble, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, MapPin, Ruler } from "lucide-react";

import { type Listing } from "../../../../lib/listing-types";
import { DEFAULT_LISTING_WIDGET_CONFIG, DETAIL_PAGE_PATH, formatListingPrice, getImageUrls, getListingLocation, normalizeListingWidgetConfig, parseWidgetJson, type ListingWidgetConfig } from "../../../../lib/site-widget";
import { t, useResolvedWidgetLanguage, widgetTextDirection, type WidgetLangCode } from "../../../../lib/widget-i18n";
import { useWidgetFonts } from "../widget-fonts";
import { ListingFiltersBar } from "./listing-filters";
import styles from "./property-listings-widget.module.css";

interface Props { config?: string; }

function getConfig(props: Props): ListingWidgetConfig {
  const parsed = parseWidgetJson(props.config ?? null, DEFAULT_LISTING_WIDGET_CONFIG);
  return normalizeListingWidgetConfig({
    ...parsed,
    gap: Math.max(0, Number(parsed.gap) || 24),
    cardRadius: Math.max(0, Number(parsed.cardRadius) || 18),
    contentPadding: Math.max(0, Number(parsed.contentPadding) || 20),
    cardBorderWidth: Math.max(0, Number(parsed.cardBorderWidth) || 0),
    cardShadow: parsed.cardShadow === "none" || parsed.cardShadow === "strong" ? parsed.cardShadow : "soft",
  });
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
    const destination = new URL(`/${DETAIL_PAGE_PATH}`, baseUrl);
    destination.searchParams.set("id", listing._id);
    await navigateTo(`${destination.pathname}${destination.search}${destination.hash}`);
  };
  return <article className={`${styles.card} ${styles.clickableCard}`} style={{ borderRadius: `${config.cardRadius}px` }} onClick={(event) => {
    // The card's own controls (save, compare, image arrows) keep their behaviour.
    if (event.target instanceof Element && event.target.closest("a, button, input, label, select, textarea")) return;
    void openDetails();
  }}>
    <button type="button" className={styles.saveButton} onClick={(event) => { event.stopPropagation(); void onSave(listing._id); }} aria-label={saved ? t(lang, "removeTitle", { title: listing.title }) : t(lang, "saveTitle", { title: listing.title })} aria-pressed={saved}>
      {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
    </button>
    <div className={styles.cardButton} role="link" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openDetails(); } }} aria-label={t(lang, "viewTitle", { title: listing.title })}>
      <ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} lang={lang} />
      <div className={styles.cardBody}>
        {config.showPrice ? <div className={styles.cardTopline}><strong>{formatListingPrice(listing, locale)}</strong></div> : null}
        <h3>{listing.title}</h3>
        {config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing, t(lang, "locationNotSet"))}</p> : null}
        {config.showMetadata ? <div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {t(lang, "bedroomsShort", { count: listing.bedrooms })}</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {t(lang, "bathroomsShort", { count: listing.bathrooms })}</span> : null}<span><Ruler /> {listing.area.toLocaleString(locale)} {listing.areaUnit}</span></div> : null}
        <span className={styles.detailsLink}>{t(lang, "viewProperty")} <ArrowRight /></span>
      </div>
    </div>
    {config.enableComparison ? <ComparisonButton listing={listing} lang={lang} className={styles.compareButton} /> : null}
  </article>;
};

const ListingsGridSkeleton: FC<{ config: ListingWidgetConfig; lang: WidgetLangCode }> = ({ config, lang }) => (
  <div className={styles.list} aria-label={t(lang, "loadingProperties")} aria-busy="true">
    {Array.from({ length: Math.max(1, config.pageSize) }, (_, index) => (
      <article className={`${styles.card} ${styles.skeletonCard}`} style={{ borderRadius: `${config.cardRadius}px` }} key={index} aria-hidden="true">
        <div className={`${styles.imageFrame} ${styles[config.imageRatio]} ${styles.skeletonImage}`} />
        <div className={styles.skeletonBody}>
          {config.showPrice ? <span className={`${styles.skeletonLine} ${styles.skeletonMeta}`} /> : null}
          <span className={`${styles.skeletonLine} ${styles.skeletonHeading}`} />
          {config.showLocation ? <span className={`${styles.skeletonLine} ${styles.skeletonText}`} /> : null}
          {config.showMetadata ? <span className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} /> : null}
          <span className={`${styles.skeletonLine} ${styles.skeletonLink}`} />
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

const listingStyle = (config: ListingWidgetConfig) => ({ "--listing-gap": `${config.gap}px`, "--listing-columns": String(config.columns), "--listing-tablet-columns": String(config.tabletColumns), "--listing-mobile-columns": String(config.mobileColumns), "--listing-background": config.backgroundColor, "--listing-card": config.cardColor, "--listing-text": config.textColor, "--listing-muted": config.mutedColor, "--listing-accent": config.accentColor, "--listing-filter-card": config.filterBackgroundColor, "--listing-filter-text": config.filterTextColor, "--listing-filter-border": config.filterBorderColor, "--listing-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--listing-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--listing-border-width": `${config.cardBorderWidth}px`, "--listing-border-color": config.cardBorderColor, "--listing-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)", font: config.bodyFont.font } as React.CSSProperties);

const PropertyListings: FC<Props> = (props) => {
  const config = useMemo(() => getConfig(props), [props.config]);
  const { lang, locale, dir, listings, totalCount, page, hasNext, loading, loadingMore, error, locked, savedIds, filters, sliderRange, sentinelRef, onSave, updateFilter, resetFilters, loadPage } = usePropertyListings(config);
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const style = listingStyle(config);
  Object.assign(style, fontStyles);
  // No active plan: keep the skeleton rather than an error message.
  if (locked) return <PropertyListingsLoading {...props} />;
  if (error && listings.length === 0 && !loading) return <div className={`${styles.root} ${styles.message}`} style={style} lang={lang} dir={dir} role="alert">{error}</div>;
  return <ComparisonScope enabled={config.enableComparison} lang={lang} locale={locale} onView={async (id) => {
    const baseUrl = await location.baseUrl();
    await navigateTo(`${baseUrl.replace(/\/+$/, '')}/property-details?id=${encodeURIComponent(id)}`);
  }}><section className={styles.root} style={style} lang={lang} dir={dir} aria-label={config.title} aria-busy={loading}>
    {config.showHeader ? <header className={styles.header}><div><h2 style={{ font: config.titleFont.font }}>{config.title}</h2><p>{config.subtitle}</p></div></header> : null}
    <ListingFiltersBar filters={filters} config={config} priceRange={sliderRange} lang={lang} locale={locale} onChange={updateFilter} onReset={resetFilters} />
    {loading && !loadingMore ? <ListingsGridSkeleton config={config} lang={lang} /> : listings.length === 0 ? <div className={styles.message}>{Object.values(filters).some(Boolean) ? t(lang, "noMatch") : t(lang, "noProperties")}</div> : <div className={styles.list}>{listings.map((listing) => <PropertyCard key={listing._id} listing={listing} config={config} saved={savedIds.has(listing._id)} lang={lang} locale={locale} onSave={onSave} />)}</div>}
    {loadingMore ? <div className={styles.inlineLoading} role="status" aria-live="polite">{t(lang, "loadingMore")}</div> : null}
    {error ? <div className={styles.inlineError} role="alert">{error}</div> : null}
    <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
    {listings.length > 0 && !(loading && !loadingMore) ? <PagingControls config={config} page={page} totalPages={Math.max(1, Math.ceil(totalCount / config.pageSize))} hasNext={hasNext} loading={loading || loadingMore} lang={lang} onLoadMore={() => void loadPage(page + 1, false)} onPageChange={(nextPage) => { if (nextPage >= 0 && nextPage < Math.ceil(totalCount / config.pageSize) && nextPage !== page) void loadPage(nextPage, true); }} /> : null}
    <ComparisonSpace />
  </section></ComparisonScope>;
};

const PropertyListingsLoading: FC<Props> = (props) => {
  const config = useMemo(() => getConfig(props), [props.config]);
  const lang = useResolvedWidgetLanguage(config.language);
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const style = Object.assign(listingStyle(config), fontStyles);
  return <section className={styles.root} style={style} lang={lang} dir={widgetTextDirection(lang)} aria-label={config.title} aria-busy="true">
    {config.showHeader ? <header className={styles.header}><div><h2 style={{ font: config.titleFont.font }}>{config.title}</h2><p>{config.subtitle}</p></div></header> : null}
    <ListingsGridSkeleton config={config} lang={lang} />
  </section>;
};

export const SubscribedWidget: FC<Props> = PropertyListings;

