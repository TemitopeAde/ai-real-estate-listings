import React, { useEffect, useMemo, useRef, useState, type FC } from "react";
import ReactDOM from "react-dom";
import reactToWebComponent from "react-to-webcomponent";
import { Map as MapLibreMap, Marker, NavigationControl, Popup, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { httpClient } from "@wix/essentials";
import { authentication, currentMember } from "@wix/site-members";
import { location } from "@wix/site-location";
import { ArrowLeft, Bath, BedDouble, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Eye, MapPin, Ruler } from "lucide-react";
import { showSiteToast } from "../../../../lib/site-toast";
import { useWidgetFonts } from "../widget-fonts";
import { useSiteThemeStyles } from "../site-theme";
import { getPanoramaImages, type Listing } from "../../../../lib/listing-types";
import { PropertyAssistant } from "./property-assistant";
import { PanoramaViewer } from "./panorama-viewer";
import { PropertySocialShare } from "./social-share";
import { DEFAULT_DETAIL_WIDGET_CONFIG, formatListingPrice, getImageUrls, getListingLocation, parseWidgetJson, type DetailWidgetConfig } from "../../../../lib/site-widget";
import styles from "./property-detail-widget.module.css";

interface Props { config?: string; }
const apiOrigin = new URL(import.meta.url).origin;

async function goToProperties(): Promise<void> {
  const baseUrl = await location.baseUrl();
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  await location.to(`${cleanBaseUrl}/properties`);
}

async function goToListing(id: string): Promise<void> {
  const baseUrl = await location.baseUrl();
  await location.to(`${baseUrl.replace(/\/+$/, "")}/property-details?id=${encodeURIComponent(id)}`);
}

async function loadListing(id: string): Promise<Listing> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?id=${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(response.status === 404 ? "not-found" : "load-failed");
  return await response.json() as Listing;
}

async function loadPublicListings(listing?: Listing, limit = 100): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (listing) {
    params.set("propertyType", listing.propertyType);
    params.set("transactionType", listing.transactionType);
  }
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  const city = listing ? (listing.address?.city || listing.city).trim().toLowerCase() : "";
  const candidates = (data as Listing[]).filter((item) => !listing || item._id !== listing._id).filter((item) => item.status === "active");
  if (!listing) return candidates.slice(0, limit);
  const sameCity = candidates.filter((item) => (item.address?.city || item.city).trim().toLowerCase() === city);
  return [...sameCity, ...candidates.filter((item) => !sameCity.some((cityItem) => cityItem._id === item._id))].slice(0, limit);
}

async function recordView(id: string): Promise<number | undefined> {
  const payload: Record<string, string> = {};
  try {
    const member = await currentMember.getMember();
    if (member?._id) payload.viewerId = member._id;
    if (member?.profile?.nickname) payload.viewerName = member.profile.nickname;
    if (member?.loginEmail) payload.viewerEmail = member.loginEmail;
  } catch (error) {
    console.info("No logged-in member available for listing view.", error);
  }
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?id=${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) return undefined;
  const data: unknown = await response.json();
  return typeof data === "object" && data !== null && "viewCount" in data && typeof data.viewCount === "number" ? data.viewCount : undefined;
}

async function savedAction(action: "list" | "save" | "remove", listingId: string): Promise<unknown> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, listingId }) });
  if (!response.ok) throw new Error(response.status === 401 ? "login-required" : "saved-failed");
  return response.json();
}

const ImageCarousel: FC<{ listing: Listing; ratio: DetailWidgetConfig["imageRatio"]; showImageControls?: boolean; showImageDots?: boolean }> = ({ listing, ratio, showImageControls = true, showImageDots = true }) => {
  const images = getImageUrls(listing);
  const [index, setIndex] = useState(0);
  const current = images[index] ?? "";
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);
  return <div className={`${styles.imageFrame} ${styles[ratio]}`}>
    {current ? <img src={current} alt={listing.title} /> : <div className={styles.imageFallback}>Property image</div>}
    {images.length > 1 && showImageControls ? <><button type="button" className={`${styles.iconButton} ${styles.previous}`} onClick={() => move(-1)} aria-label="Previous property image"><ChevronLeft /></button><button type="button" className={`${styles.iconButton} ${styles.next}`} onClick={() => move(1)} aria-label="Next property image"><ChevronRight /></button>{showImageDots ? <div className={styles.dots} aria-label={`${index + 1} of ${images.length} images`}>{images.map((image, imageIndex) => <span key={image} className={imageIndex === index ? styles.activeDot : ""} />)}</div> : null}</> : null}
  </div>;
};

const FeaturedCard: FC<{ listing: Listing; config: DetailWidgetConfig; saved: boolean; onSave: (id: string) => void }> = ({ listing, config, saved, onSave }) => (
  <article className={styles.featuredCard} style={{ borderRadius: `${config.cardRadius}px` }}>
    <button type="button" className={styles.featuredSave} onClick={() => onSave(listing._id)} aria-label={saved ? `Remove ${listing.title} from saved properties` : `Save ${listing.title}`} aria-pressed={saved}>
      {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
    </button>
    <div className={styles.featuredLink} role="link" tabIndex={0} onClick={(event) => { if (event.target instanceof HTMLElement && event.target.closest("button")) return; void goToListing(listing._id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void goToListing(listing._id); } }}>
      <ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} />
      <div className={styles.featuredBody}>
        <div className={styles.featuredTopline}>{config.featuredShowStatus ? <span className={styles.featuredStatus}>Available</span> : null}{config.featuredShowPrice ? <strong>{formatListingPrice(listing)}</strong> : null}</div>
        <h3>{listing.title}</h3>
        {config.featuredShowLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing)}</p> : null}
        {config.featuredShowMetadata ? <div className={styles.featuredMetadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {listing.bedrooms} bd</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {listing.bathrooms} ba</span> : null}<span><Ruler /> {listing.area.toLocaleString()} {listing.areaUnit}</span></div> : null}
      </div>
    </div>
  </article>
);

const DetailSkeleton: FC<{ config: DetailWidgetConfig; style: React.CSSProperties; rootRef: React.Ref<HTMLElement> }> = ({ config, style, rootRef }) => (
    <article ref={rootRef} className={`${styles.root} ${styles.skeletonRoot}`} style={{
    ...style,
    "--detail-padding": `${config.contentPadding}px`,
  } as React.CSSProperties} aria-label="Loading property" aria-busy="true">
    <div className={styles.detailCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.content}>
        <span className={`${styles.skeletonLine} ${styles.skeletonBack}`} />
        <div className={styles.skeletonHeading}>
          <div><span className={`${styles.skeletonLine} ${styles.skeletonTitle}`} /><span className={`${styles.skeletonLine} ${styles.skeletonLocation}`} /></div>
          <span className={`${styles.skeletonLine} ${styles.skeletonPrice}`} />
        </div>
        <span className={`${styles.skeletonLine} ${styles.skeletonViews}`} />
        <div className={styles.skeletonDescription}><span /><span /><span /></div>
        <div className={styles.skeletonMetadata}><span /><span /><span /></div>
      </div>
    </div>
  </article>
);

const PropertyMap: FC<{ listing: Listing }> = ({ listing }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const coordinates =
    typeof listing.latitude === "number" &&
    Number.isFinite(listing.latitude) &&
    typeof listing.longitude === "number" &&
    Number.isFinite(listing.longitude)
      ? { latitude: listing.latitude, longitude: listing.longitude }
      : undefined;

  useEffect(() => {
    if (!containerRef.current || !coordinates) return;
    let nearbyListings: Listing[] = [];
    const map = new MapLibreMap({
      container: containerRef.current,
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 14,
      minZoom: 3,
      maxZoom: 19,
      style: {
        version: 8,
        sources: {
          openstreetmap: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "openstreetmap", type: "raster", source: "openstreetmap" }],
      },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("nearby-properties", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterMaxZoom: 14, clusterRadius: 48 });
      map.addLayer({ id: "nearby-clusters", type: "circle", source: "nearby-properties", filter: ["has", "point_count"], paint: { "circle-color": "#0c3b2e", "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 30], "circle-opacity": 0.9 } });
      map.addLayer({ id: "nearby-cluster-count", type: "symbol", source: "nearby-properties", filter: ["has", "point_count"], layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 }, paint: { "text-color": "#ffffff" } });
      map.addLayer({ id: "nearby-points", type: "circle", source: "nearby-properties", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#4f8f6b", "circle-radius": 7, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
      const updateVisibleProperties = () => {
        const source = map.getSource("nearby-properties");
        if (!source || !("setData" in source)) return;
        const bounds = map.getBounds();
        const features = nearbyListings.filter((property) => property._id !== listing._id && typeof property.latitude === "number" && typeof property.longitude === "number" && bounds.contains([property.longitude, property.latitude])).map((property) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [property.longitude as number, property.latitude as number] }, properties: { id: property._id, title: property.title, city: property.city } }));
        (source as GeoJSONSource).setData({ type: "FeatureCollection", features });
      };
      searchButtonRef.current?.addEventListener("click", updateVisibleProperties);
      map.on("moveend", updateVisibleProperties);
      map.on("click", "nearby-clusters", (event) => { const feature = event.features?.[0]; const clusterId = feature?.properties?.cluster_id; if (typeof clusterId === "number") (map.getSource("nearby-properties") as GeoJSONSource).getClusterExpansionZoom(clusterId).then((zoom) => { const center = feature?.geometry.type === "Point" ? feature.geometry.coordinates as [number, number] : undefined; if (center) map.easeTo({ center, zoom }); }).catch((error) => console.error("Unable to expand property cluster.", error)); });
      map.on("click", "nearby-points", (event) => { const feature = event.features?.[0]; const geometry = feature?.geometry; if (!feature || !geometry || geometry.type !== "Point") return; const coordinates = geometry.coordinates as [number, number]; new Popup().setLngLat(coordinates).setHTML(`<strong>${String(feature.properties?.title ?? "Property")}</strong><br>${String(feature.properties?.city ?? "")}`).addTo(map); });
      void loadPublicListings().then((properties) => { nearbyListings = properties; updateVisibleProperties(); }).catch((error) => console.error("Unable to load nearby properties.", error));
    });
    new Marker({ color: "#0c3b2e" })
      .setLngLat([coordinates.longitude, coordinates.latitude])
      .setPopup(new Popup().setText(listing.title))
      .addTo(map);
    return () => { searchButtonRef.current?.replaceWith(searchButtonRef.current.cloneNode(true)); map.remove(); };
  }, [coordinates, listing.title]);

  if (!coordinates) {
    return <div className={styles.mapFallback}>Map location is not available for this property.</div>;
  }
  return <div className={styles.mapWrap}><div ref={containerRef} className={styles.map} aria-label={`Map showing ${listing.title}`} /><button ref={searchButtonRef} type="button" className={styles.searchAreaButton}>Search this area</button></div>;
};

const QuoteRequestModal: FC<{ listing: Listing; onClose: () => void }> = ({ listing, onClose }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/quote-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing._id, ...form }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'The request could not be submitted.');
      setSuccess(true);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'The request could not be submitted.'); } finally { setSubmitting(false); }
  };
  return <div className={styles.quoteOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={styles.quoteModal} role="dialog" aria-modal="true" aria-labelledby="quote-request-title"><button type="button" className={styles.quoteClose} onClick={onClose} aria-label="Close quote request">×</button>{success ? <div className={styles.quoteSuccess}><h2 id="quote-request-title">Request received</h2><p>Thank you. An agent will contact you about {listing.title}.</p><button type="button" className={styles.quoteSubmit} onClick={onClose}>Done</button></div> : <><h2 id="quote-request-title">Request a quote</h2><p className={styles.quoteIntro}>Tell us how we can help with {listing.title}.</p><form onSubmit={(event) => void submit(event)}><div className={styles.quoteFields}><label>First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label><label>Last name<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Phone<input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label className={styles.quoteMessage}>Message<textarea rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label></div>{error ? <p className={styles.quoteError} role="alert">{error}</p> : null}<button type="submit" className={styles.quoteSubmit} disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</button></form></>}</section></div>;
};

const PropertyDetail: FC<Props> = ({ config: rawConfig }) => {
  const config = useMemo(() => parseWidgetJson(rawConfig ?? null, DEFAULT_DETAIL_WIDGET_CONFIG), [rawConfig]);
  const rootRef = useRef<HTMLElement | null>(null);
  useSiteThemeStyles(rootRef);
  const assignRootRef = (element: HTMLElement | null) => {
    rootRef.current = element;
  };
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const [listing, setListing] = useState<Listing | null>(null);
  const [viewCount, setViewCount] = useState<number | undefined>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [featuredSavedIds, setFeaturedSavedIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<"loading" | "missing" | "not-found" | "error" | "ready">("loading");
  useEffect(() => {
    let mounted = true;
    void location.query().then((query) => {
      const queryRecord = typeof query === "object" && query !== null ? query as Record<string, unknown> : {};
      const id = queryRecord.id;
      if (typeof id !== "string" || !id) { if (mounted) setState("missing"); return; }
      return loadListing(id).then(async (data) => { if (!mounted) return; setListing(data); setViewCount(data.viewCount); setState("ready"); try { const savedResponse = await savedAction("list", id); const value = typeof savedResponse === "object" && savedResponse !== null ? savedResponse as { items?: Array<{ id?: string }> } : {}; if (mounted) setSaved((value.items ?? []).some((item) => item.id === id)); } catch { /* Guests start unsaved. */ } return recordView(id); }).then((count) => { if (mounted && typeof count === "number") setViewCount(count); }).catch((reason: unknown) => { if (!mounted) return; setState(reason instanceof Error && reason.message === "not-found" ? "not-found" : "error"); });
    }).catch((reason: unknown) => { console.error("Unable to read property URL.", reason); if (mounted) setState("error"); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!listing || !config.showFeaturedListings) return;
    let mounted = true;
    void loadPublicListings(listing, Math.min(8, Math.max(1, Math.round(config.featuredCount)))).then((items) => { if (mounted) setFeaturedListings(items); }).catch((error: unknown) => console.error("Unable to load related properties.", error));
    return () => { mounted = false; };
  }, [listing, config.showFeaturedListings, config.featuredCount]);
  const style = { "--detail-background": config.backgroundColor, "--detail-card": config.cardColor, "--detail-text": config.textColor, "--detail-muted": config.mutedColor, "--detail-accent": config.accentColor, "--detail-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--detail-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--detail-border-width": `${config.cardBorderWidth}px`, "--detail-border-color": config.cardBorderColor, "--detail-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)", font: config.bodyFont.font } as React.CSSProperties;
  Object.assign(style, fontStyles, { "--detail-amenities-text": config.amenitiesTextColor, "--detail-amenities-background": config.amenitiesBackgroundColor, "--detail-share-facebook": config.shareFacebookColor, "--detail-share-instagram": config.shareInstagramColor, "--detail-share-whatsapp": config.shareWhatsappColor, "--detail-share-x": config.shareXColor, "--detail-share-linkedin": config.shareLinkedinColor });
  if (state === "loading") return <DetailSkeleton config={config} style={style} rootRef={assignRootRef} />;
  if (!listing) return <div ref={assignRootRef} className={`${styles.root} ${styles.message}`} style={style}>{state === "missing" ? "No property was selected." : state === "not-found" ? "This property is no longer available." : "The property is temporarily unavailable."}</div>;
  const handleSave = async () => {
    if (saving) return;
    const previous = saved;
    const next = !saved;
    setSaved(next);
    setSaving(true);
    try {
      try { await savedAction(previous ? "remove" : "save", listing._id); } catch (error) {
        if (!(error instanceof Error) || error.message !== "login-required") throw error;
        await authentication.promptLogin();
        await savedAction("save", listing._id);
        setSaved(true);
      }
      window.dispatchEvent(new CustomEvent("saved-properties:changed", { detail: { listingId: listing._id, saved: next } }));
      showSiteToast(next ? "Property saved" : "Property removed", next ? "You can find it in your saved properties." : "The property was removed from your saved list.");
    } catch (error) {
      setSaved(previous);
      console.error("Unable to update saved property.", error);
      showSiteToast(error instanceof Error && error.message === "login-required" ? "Sign in to save properties" : "Could not update saved property", "Please try again.", "error");
    } finally { setSaving(false); }
  };
  const handleFeaturedSave = (id: string) => {
    const wasSaved = featuredSavedIds.has(id);
    setFeaturedSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(id); else next.add(id);
      return next;
    });
    void savedAction(wasSaved ? "remove" : "save", id).catch((error: unknown) => {
      setFeaturedSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(id); else next.delete(id);
        return next;
      });
      console.error("Unable to update related saved property.", error);
      showSiteToast("Sign in to save properties", "Please try again.", "error");
    });
  };
  const panoramas = getPanoramaImages(listing);
  return <article className={styles.root} style={style}><div className={styles.detailCard} style={{ borderRadius: `${config.cardRadius}px` }}><ImageCarousel listing={listing} ratio={config.imageRatio} /><div className={styles.content}><button type="button" className={styles.backButton} onClick={() => void goToProperties()}><ArrowLeft /> Back to properties</button><div className={styles.heading}><div><h1 style={{ font: config.titleFont.font }}>{listing.title}</h1>{config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing)}</p> : null}</div><div className={styles.priceRow}><div className={styles.price}>{formatListingPrice(listing)}</div>{/* <button type="button" className={styles.quoteButton} onClick={() => setQuoteOpen(true)}>Request a quote</button> */}<button type="button" className={styles.saveButton} onClick={() => void handleSave()} aria-busy={saving} aria-label={saved ? "Remove property from saved properties" : "Save property"} aria-pressed={saved}>{saved ? <BookmarkCheck /> : <Bookmark />}</button></div></div>{config.showViewCount ? <div className={styles.views}><Eye /> {viewCount ?? listing.viewCount} views</div> : null}{config.showSocialShare ? <PropertySocialShare listing={listing} /> : null}{config.showAiAssistant ? <PropertyAssistant listing={listing} /> : null}{panoramas.length ? <section className={styles.section}><h2>360° virtual tour</h2><PanoramaViewer images={panoramas} title={listing.title} /></section> : null}{config.showDescription && listing.description ? <div className={styles.description} dangerouslySetInnerHTML={{ __html: listing.description }} /> : null}<div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {listing.bedrooms} bedrooms</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {listing.bathrooms} bathrooms</span> : null}<span><Ruler /> {listing.area.toLocaleString()} {listing.areaUnit}</span></div>{config.showLocation ? <section className={styles.section}><h2>Location</h2><PropertyMap listing={listing} /></section> : null}{config.showAmenities && listing.amenities?.length ? <section className={styles.section}><h2>Amenities</h2><ul>{listing.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul></section> : null}{config.showAgent && listing.agentName ? <section className={styles.section}><h2>Contact</h2><p className={styles.agent}>{listing.agentName}{listing.agentPhone ? ` · ${listing.agentPhone}` : ""}{listing.agentEmail ? ` · ${listing.agentEmail}` : ""}</p></section> : null}</div></div>{config.showFeaturedListings && featuredListings.length ? <section className={styles.featuredSection} aria-label={config.featuredTitle}><header className={styles.featuredHeader}><div><h2>{config.featuredTitle}</h2><p>{config.featuredSubtitle}</p></div><div className={styles.featuredControls}><button type="button" aria-label="Previous related properties" onClick={() => document.getElementById("featured-properties")?.scrollBy({ left: -320, behavior: "smooth" })}><ChevronLeft /></button><button type="button" aria-label="Next related properties" onClick={() => document.getElementById("featured-properties")?.scrollBy({ left: 320, behavior: "smooth" })}><ChevronRight /></button></div></header><div id="featured-properties" className={styles.featuredList} style={{ gap: `${config.featuredGap}px` }}>{featuredListings.map((item) => <FeaturedCard key={item._id} listing={item} config={config} saved={featuredSavedIds.has(item._id)} onSave={handleFeaturedSave} />)}</div></section> : null}{quoteOpen ? <QuoteRequestModal listing={listing} onClose={() => setQuoteOpen(false)} /> : null}</article>;
};

export default reactToWebComponent(PropertyDetail, React, ReactDOM as any, { props: { config: "string" } });
