import React, { useEffect, useMemo, useState, type FC } from "react";
import ReactDOM from "react-dom";
import reactToWebComponent from "react-to-webcomponent";
import { httpClient } from "@wix/essentials";
import { authentication } from "@wix/site-members";
import { location } from "@wix/site-location";
import { ArrowRight, Bath, BedDouble, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, MapPin, Ruler } from "lucide-react";
import { showSiteToast } from "../../../../lib/site-toast";
import { useWidgetFonts } from "../widget-fonts";

import type { Listing } from "../../../../lib/listing-types";
import { DEFAULT_LISTING_WIDGET_CONFIG, DETAIL_PAGE_PATH, formatListingPrice, getImageUrls, getListingLocation, parseWidgetJson, type ListingWidgetConfig } from "../../../../lib/site-widget";
import styles from "./property-listings-widget.module.css";

interface Props { config?: string; layout?: string; detailPagePath?: string; }
const apiOrigin = new URL(import.meta.url).origin;

function getConfig(props: Props): ListingWidgetConfig {
  const parsed = parseWidgetJson(props.config ?? null, DEFAULT_LISTING_WIDGET_CONFIG);
  return {
    ...parsed,
    layout: props.layout === "carousel" || parsed.layout === "carousel" ? "carousel" : "grid",
    detailPagePath: props.detailPagePath?.trim() || parsed.detailPagePath || DETAIL_PAGE_PATH,
    columns: Math.min(4, Math.max(1, Math.round(Number(parsed.columns) || 3))),
    gap: Math.max(0, Number(parsed.gap) || 24),
    cardRadius: Math.max(0, Number(parsed.cardRadius) || 18),
    contentPadding: Math.max(0, Number(parsed.contentPadding) || 20),
    cardBorderWidth: Math.max(0, Number(parsed.cardBorderWidth) || 0),
    cardShadow: parsed.cardShadow === "none" || parsed.cardShadow === "strong" ? parsed.cardShadow : "soft",
  };
}

async function loadListings(): Promise<Listing[]> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Listings could not be loaded.");
  const data: unknown = await response.json();
  return Array.isArray(data) ? data as Listing[] : [];
}

async function savedAction(action: "list" | "save" | "remove", listingId?: string): Promise<unknown> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, listingId }) });
  if (!response.ok) throw new Error(response.status === 401 ? "login-required" : "saved-failed");
  return response.json();
}

const ImageCarousel: FC<{ listing: Listing; ratio: ListingWidgetConfig["imageRatio"]; showImageControls: boolean; showImageDots: boolean }> = ({ listing, ratio, showImageControls, showImageDots }) => {
  const images = getImageUrls(listing);
  const [index, setIndex] = useState(0);
  const current = images[index] ?? "";
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);
  return <div className={`${styles.imageFrame} ${styles[ratio]}`}>
    {current ? <img src={current} alt={listing.title} loading="lazy" /> : <div className={styles.imageFallback}>Property image</div>}
    {images.length > 1 && showImageControls ? <>
      <button className={`${styles.iconButton} ${styles.previous}`} type="button" onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label="Previous property image"><ChevronLeft /></button>
      <button className={`${styles.iconButton} ${styles.next}`} type="button" onClick={(event) => { event.stopPropagation(); move(1); }} aria-label="Next property image"><ChevronRight /></button>
      {showImageDots ? <div className={styles.dots} aria-label={`${index + 1} of ${images.length} images`}>{images.map((image, imageIndex) => <span key={image} className={imageIndex === index ? styles.activeDot : ""} />)}</div> : null}
    </> : null}
  </div>;
};

const PropertyCard: FC<{ listing: Listing; config: ListingWidgetConfig; saved: boolean; onSave: (listingId: string) => Promise<void> }> = ({ listing, config, saved, onSave }) => {
  const openDetails = async () => {
    const baseUrl = await location.baseUrl();
    const path = config.detailPagePath.replace(/^\/+|\/+$/g, "") || DETAIL_PAGE_PATH;
    await location.to(`${baseUrl.replace(/\/+$/, "")}/${path}?id=${encodeURIComponent(listing._id)}`);
  };
  return <article className={styles.card} style={{ borderRadius: `${config.cardRadius}px` }}>
    <button type="button" className={styles.saveButton} onClick={(event) => { event.stopPropagation(); void onSave(listing._id); }} aria-label={saved ? `Remove ${listing.title} from saved properties` : `Save ${listing.title}`} aria-pressed={saved}>
      {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
    </button>
    <div className={styles.cardButton} role="link" tabIndex={0} onClick={() => void openDetails()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openDetails(); } }} aria-label={`View ${listing.title}`}>
      <ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} />
      <div className={styles.cardBody}>
        <div className={styles.cardTopline}>{config.showStatus ? <span className={styles.status}>Available</span> : null}{config.showPrice ? <strong>{formatListingPrice(listing)}</strong> : null}</div>
        <h3>{listing.title}</h3>
        {config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing)}</p> : null}
        {config.showMetadata ? <div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {listing.bedrooms} bd</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {listing.bathrooms} ba</span> : null}<span><Ruler /> {listing.area.toLocaleString()} {listing.areaUnit}</span></div> : null}
        <span className={styles.detailsLink}>View property <ArrowRight /></span>
      </div>
    </div>
  </article>;
};

const ListingsSkeleton: FC<{ config: ListingWidgetConfig; style: React.CSSProperties }> = ({ config, style }) => (
  <section className={`${styles.root} ${styles.gridLayout}`} style={{
    ...style,
    "--listing-columns": String(config.columns),
    "--listing-gap": `${config.gap}px`,
  } as React.CSSProperties} aria-label="Loading properties" aria-busy="true">
    {config.showHeader ? <header className={styles.header}>
      <div><span className={`${styles.skeletonLine} ${styles.skeletonTitle}`} /><span className={`${styles.skeletonLine} ${styles.skeletonSubtitle}`} /></div>
      <span className={`${styles.skeletonLine} ${styles.skeletonCount}`} />
    </header> : null}
    <div className={styles.list}>
      {Array.from({ length: Math.max(1, config.columns) }, (_, index) => (
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
  </section>
);

const PropertyListings: FC<Props> = (props) => {
  const config = useMemo(() => getConfig(props), [props.config, props.detailPagePath, props.layout]);
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let mounted = true;
    void loadListings().then((data) => { if (mounted) { setListings(data); setLoading(false); } }).catch((reason: unknown) => { console.error("Unable to load public listings.", reason); if (mounted) { setError("Properties are temporarily unavailable."); setLoading(false); } });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    void savedAction("list").then((result) => {
      const value = typeof result === "object" && result !== null ? result as { items?: Array<{ id?: string }> } : {};
      setSavedIds(new Set((value.items ?? []).flatMap((item) => item.id ? [item.id] : [])));
    }).catch(() => { /* Guests have no saved state until they authenticate. */ });
  }, []);
  const onSave = async (listingId: string) => {
    try {
      const nextSaved = !savedIds.has(listingId);
      if (nextSaved) {
        try { await savedAction("save", listingId); } catch (error) {
          if (!(error instanceof Error) || error.message !== "login-required") throw error;
          await authentication.promptLogin();
          await savedAction("save", listingId);
        }
      } else await savedAction("remove", listingId);
      setSavedIds((current) => { const next = new Set(current); if (nextSaved) next.add(listingId); else next.delete(listingId); return next; });
      window.dispatchEvent(new CustomEvent("saved-properties:changed", { detail: { listingId, saved: nextSaved } }));
      showSiteToast(nextSaved ? "Property saved" : "Property removed", nextSaved ? "You can find it in your saved properties." : "The property was removed from your saved list.");
    } catch (error) { console.error("Unable to update saved property.", error); showSiteToast(error instanceof Error && error.message === "login-required" ? "Sign in to save properties" : "Could not update saved property", "Please try again.", "error"); }
  };
  const style = { "--listing-gap": `${config.gap}px`, "--listing-columns": String(config.columns), "--listing-background": config.backgroundColor, "--listing-card": config.cardColor, "--listing-text": config.textColor, "--listing-muted": config.mutedColor, "--listing-accent": config.accentColor, "--listing-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--listing-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--listing-border-width": `${config.cardBorderWidth}px`, "--listing-border-color": config.cardBorderColor, "--listing-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)", font: config.bodyFont.font } as React.CSSProperties;
  Object.assign(style, fontStyles);
  if (loading) return <ListingsSkeleton config={config} style={style} />;
  if (error) return <div className={`${styles.root} ${styles.message}`} style={style} role="alert">{error}</div>;
  return <section className={`${styles.root} ${config.layout === "carousel" ? styles.carouselLayout : styles.gridLayout}`} style={style} aria-label={config.title}>
    {config.showHeader ? <header className={styles.header}><div><h2 style={{ font: config.titleFont.font }}>{config.title}</h2><p>{config.subtitle}</p></div><span>{listings.length} available</span></header> : null}
    {listings.length === 0 ? <div className={styles.message}>No properties are available right now.</div> : <div className={styles.list}>{listings.map((listing) => <PropertyCard key={listing._id} listing={listing} config={config} saved={savedIds.has(listing._id)} onSave={onSave} />)}</div>}
  </section>;
};

export default reactToWebComponent(PropertyListings, React, ReactDOM as any, { props: { config: "string", layout: "string", detailPagePath: "string" } });
