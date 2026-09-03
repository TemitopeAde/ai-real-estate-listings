import React, { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState, type FC } from "react";
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
import { getPanoramaImages, type Listing } from "../../../../lib/listing-types";
import { LOCKED_PUBLIC_ACCESS, type PublicListingAccess } from "../../../../lib/entitlement";
import { PropertyAssistant } from "./property-assistant";
import { PanoramaViewer } from "./panorama-viewer";
import { PropertySocialShare } from "./social-share";
import { DEFAULT_DETAIL_WIDGET_CONFIG, formatListingPrice, getImageUrls, getListingLocation, normalizeDetailWidgetConfig, parseWidgetJson, type DetailWidgetConfig } from "../../../../lib/site-widget";
import { t, useResolvedWidgetLanguage, useResolvedWidgetLocale, widgetTextDirection, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

const QuoteMessageEditor = lazy(() =>
  import("./quote-message-editor").then((module) => ({ default: module.QuoteMessageEditor })),
);

function plainFromHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

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

function ListingContact({ listing, lang }: { listing: Listing; lang: WidgetLangCode }) {
  const parts: React.ReactNode[] = [];
  if (listing.agentName) parts.push(<span key="name">{listing.agentName}</span>);
  if (listing.agentPhone) {
    parts.push(
      <a key="phone" href={`tel:${listing.agentPhone.replace(/[^\d+]/g, "")}`}>
        {listing.agentPhone}
      </a>,
    );
  }
  if (listing.agentEmail) {
    parts.push(
      <a key="email" href={`mailto:${listing.agentEmail}`}>
        {listing.agentEmail}
      </a>,
    );
  }
  if (parts.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2>{t(lang, "contact")}</h2>
      <p className={styles.agent}>
        {parts.map((part, index) => (
          <Fragment key={index}>
            {index > 0 ? " · " : null}
            {part}
          </Fragment>
        ))}
      </p>
    </section>
  );
}

function listingAccess(value: unknown): PublicListingAccess {
  if (!value || typeof value !== "object") return LOCKED_PUBLIC_ACCESS;
  const source = value as Record<string, unknown>;
  return {
    virtualTour: source.virtualTour === true,
    multiSceneTour: source.multiSceneTour === true,
    socialShare: source.socialShare === true,
    assistant: source.assistant === true,
    relatedListings: source.relatedListings === true,
  };
}

async function loadListing(id: string): Promise<{ listing: Listing; access: PublicListingAccess }> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?id=${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(response.status === 404 ? "not-found" : "load-failed");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") throw new Error("load-failed");
  const record = data as Listing & { access?: unknown };
  const { access: rawAccess, ...listing } = record;
  return { listing, access: listingAccess(rawAccess) };
}

async function loadPublicListings(listing?: Listing, limit = 100): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (listing) {
    params.set("propertyType", listing.propertyType);
    params.set("transactionType", listing.transactionType);
  }
  params.set("pageSize", String(Math.min(100, Math.max(1, limit + 4))));
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data: unknown = await response.json();
  const items =
    data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
      ? ((data as { items: Listing[] }).items)
      : [];
  const city = listing ? (listing.address?.city || listing.city).trim().toLowerCase() : "";
  const candidates = items.filter((item) => !listing || item._id !== listing._id).filter((item) => item.status === "active");
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

const ImageCarousel: FC<{ listing: Listing; ratio: DetailWidgetConfig["imageRatio"]; showImageControls?: boolean; showImageDots?: boolean; lang: WidgetLangCode }> = ({ listing, ratio, showImageControls = true, showImageDots = true, lang }) => {
  const images = getImageUrls(listing);
  const [index, setIndex] = useState(0);
  const current = images[index] ?? "";
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);
  return <div className={`${styles.imageFrame} ${styles[ratio]}`}>
    {current ? <img src={current} alt={listing.title} /> : <div className={styles.imageFallback}>{t(lang, "propertyImage")}</div>}
    {images.length > 1 && showImageControls ? <><button type="button" className={`${styles.iconButton} ${styles.previous}`} onClick={() => move(-1)} aria-label={t(lang, "previousImage")}><ChevronLeft /></button><button type="button" className={`${styles.iconButton} ${styles.next}`} onClick={() => move(1)} aria-label={t(lang, "nextImage")}><ChevronRight /></button>{showImageDots ? <div className={styles.dots} aria-label={t(lang, "imageCount", { current: index + 1, total: images.length })}>{images.map((image, imageIndex) => <span key={image} className={imageIndex === index ? styles.activeDot : ""} />)}</div> : null}</> : null}
  </div>;
};

const FeaturedCard: FC<{ listing: Listing; config: DetailWidgetConfig; saved: boolean; lang: WidgetLangCode; locale: string; onSave: (id: string) => void }> = ({ listing, config, saved, lang, locale, onSave }) => (
  <article className={styles.featuredCard} style={{ borderRadius: `${config.cardRadius}px` }}>
    <button type="button" className={styles.featuredSave} onClick={() => onSave(listing._id)} aria-label={saved ? t(lang, "removeTitle", { title: listing.title }) : t(lang, "saveTitle", { title: listing.title })} aria-pressed={saved}>
      {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
    </button>
    <div className={styles.featuredLink} role="link" tabIndex={0} onClick={(event) => { if (event.target instanceof HTMLElement && event.target.closest("button")) return; void goToListing(listing._id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void goToListing(listing._id); } }}>
      <ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} lang={lang} />
      <div className={styles.featuredBody}>
        <div className={styles.featuredTopline}>{config.featuredShowStatus ? <span className={styles.featuredStatus}>{t(lang, "available")}</span> : null}{config.featuredShowPrice ? <strong>{formatListingPrice(listing, locale)}</strong> : null}</div>
        <h3>{listing.title}</h3>
        {config.featuredShowLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing, t(lang, "locationNotSet"))}</p> : null}
        {config.featuredShowMetadata ? <div className={styles.featuredMetadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {t(lang, "bedroomsShort", { count: listing.bedrooms })}</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {t(lang, "bathroomsShort", { count: listing.bathrooms })}</span> : null}<span><Ruler /> {listing.area.toLocaleString(locale)} {listing.areaUnit}</span></div> : null}
      </div>
    </div>
  </article>
);

const DetailSkeleton: FC<{ config: DetailWidgetConfig; style: React.CSSProperties; lang: WidgetLangCode; dir: "ltr" | "rtl" }> = ({ config, style, lang, dir }) => (
    <article className={`${styles.root} ${styles.skeletonRoot}`} style={{
    ...style,
    "--detail-padding": `${config.contentPadding}px`,
  } as React.CSSProperties} lang={lang} dir={dir} aria-label={t(lang, "loadingProperty")} aria-busy="true">
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

const PropertyMap: FC<{ listing: Listing; lang: WidgetLangCode }> = ({ listing, lang }) => {
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
    return <div className={styles.mapFallback}>{t(lang, "mapUnavailable")}</div>;
  }
  return <div className={styles.mapWrap}><div ref={containerRef} className={styles.map} aria-label={t(lang, "mapLabel", { title: listing.title })} /><button ref={searchButtonRef} type="button" className={styles.searchAreaButton}>{t(lang, "searchThisArea")}</button></div>;
};

const QuoteRequestModal: FC<{ listing: Listing; lang: WidgetLangCode; onClose: () => void }> = ({ listing, lang, onClose }) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError("");
  };

  const validate = () => {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.firstName.trim()) next.firstName = t(lang, "enterFirstName");
    if (!form.lastName.trim()) next.lastName = t(lang, "enterLastName");
    if (!form.email.trim()) next.email = t(lang, "enterEmail");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t(lang, "validEmail");
    }
    if (!form.phone.trim()) next.phone = t(lang, "enterPhone");
    else if (!/^[+()\d\s.-]{7,30}$/.test(form.phone.trim())) {
      next.phone = t(lang, "validPhone");
    }
    if (plainFromHtml(form.message).length > 2000) next.message = t(lang, "messageTooLong");
    return next;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) {
      setError(t(lang, "fixFields"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/quote-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing._id, ...form }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? t(lang, "quoteFailed"));
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t(lang, "quoteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement> = {},
  ) => {
    const invalid = Boolean(fieldErrors[key]);
    const shared = {
      value: form[key],
      "aria-invalid": invalid,
      "aria-describedby": invalid ? `quote-${key}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        update(key, event.target.value);
      },
    };
    return (
      <label className={key === "message" ? styles.quoteMessage : undefined}>
        {label}
        {key === "message" ? <textarea rows={4} {...shared} /> : <input {...props} {...shared} />}
        {invalid ? (
          <span id={`quote-${key}-error`} className={styles.quoteFieldError} role="alert">
            {fieldErrors[key]}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div
      className={styles.quoteOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.quoteModal} role="dialog" aria-modal="true" aria-labelledby="quote-request-title">
        <button type="button" className={styles.quoteClose} onClick={onClose} aria-label={t(lang, "closeQuote")}>×</button>
        {success ? (
          <div className={styles.quoteSuccess}>
            <h2 id="quote-request-title">{t(lang, "requestReceived")}</h2>
            <p>{t(lang, "thankYouQuote", { title: listing.title })}</p>
            <button type="button" className={styles.quoteSubmit} onClick={onClose}>{t(lang, "done")}</button>
          </div>
        ) : (
          <>
            <h2 id="quote-request-title">{t(lang, "requestQuote")}</h2>
            <p className={styles.quoteIntro}>{t(lang, "quoteIntro", { title: listing.title })}</p>
            <form onSubmit={(event) => void submit(event)} noValidate>
              <div className={styles.quoteFields}>
                {field("firstName", t(lang, "firstName"), { autoComplete: "given-name" })}
                {field("lastName", t(lang, "lastName"), { autoComplete: "family-name" })}
                {field("email", t(lang, "email"), { type: "text", inputMode: "email", autoComplete: "email" })}
                {field("phone", t(lang, "phone"), { type: "tel", autoComplete: "tel" })}
                <label className={styles.quoteMessage}>
                  {t(lang, "message")}
                  <div
                    className={`${styles.quoteEditor}${fieldErrors.message ? ` ${styles.quoteEditorInvalid}` : ""}`}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "quote-message-error" : undefined}
                  >
                    <Suspense fallback={<div className={styles.quoteEditorFallback}>{t(lang, "loadingEditor")}</div>}>
                      <QuoteMessageEditor
                        value={form.message}
                        invalid={Boolean(fieldErrors.message)}
                        lang={lang}
                        onChange={(value) => update("message", value)}
                      />
                    </Suspense>
                  </div>
                  {fieldErrors.message ? (
                    <span id="quote-message-error" className={styles.quoteFieldError} role="alert">
                      {fieldErrors.message}
                    </span>
                  ) : null}
                </label>
              </div>
              {error ? <p className={styles.quoteError} role="alert">{error}</p> : null}
              <button type="submit" className={styles.quoteSubmit} disabled={submitting}>
                {submitting ? t(lang, "sending") : t(lang, "sendRequest")}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

const PropertyDetail: FC<Props> = ({ config: rawConfig }) => {
  const config = useMemo(() => normalizeDetailWidgetConfig(parseWidgetJson(rawConfig ?? null, DEFAULT_DETAIL_WIDGET_CONFIG)), [rawConfig]);
  const lang = useResolvedWidgetLanguage(config.language);
  const locale = useResolvedWidgetLocale(lang);
  const dir = widgetTextDirection(lang);
  const dismissToast = t(lang, "dismissNotification");
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const [listing, setListing] = useState<Listing | null>(null);
  const [access, setAccess] = useState<PublicListingAccess>(LOCKED_PUBLIC_ACCESS);
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
      return loadListing(id).then(async (data) => { if (!mounted) return; setListing(data.listing); setAccess(data.access); setViewCount(data.listing.viewCount); setState("ready"); try { const savedResponse = await savedAction("list", id); const value = typeof savedResponse === "object" && savedResponse !== null ? savedResponse as { items?: Array<{ id?: string }> } : {}; if (mounted) setSaved((value.items ?? []).some((item) => item.id === id)); } catch { /* Guests start unsaved. */ } return recordView(id); }).then((count) => { if (mounted && typeof count === "number") setViewCount(count); }).catch((reason: unknown) => { if (!mounted) return; setState(reason instanceof Error && reason.message === "not-found" ? "not-found" : "error"); });
    }).catch((reason: unknown) => { console.error("Unable to read property URL.", reason); if (mounted) setState("error"); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!listing || !config.showFeaturedListings || !access.relatedListings) return;
    let mounted = true;
    void loadPublicListings(listing, Math.min(8, Math.max(1, Math.round(config.featuredCount)))).then((items) => { if (mounted) setFeaturedListings(items); }).catch((error: unknown) => console.error("Unable to load related properties.", error));
    return () => { mounted = false; };
  }, [listing, config.showFeaturedListings, config.featuredCount, access.relatedListings]);
  const style = { "--detail-background": config.backgroundColor, "--detail-card": config.cardColor, "--detail-text": config.textColor, "--detail-muted": config.mutedColor, "--detail-accent": config.accentColor, "--detail-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--detail-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--detail-border-width": `${config.cardBorderWidth}px`, "--detail-border-color": config.cardBorderColor, "--detail-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)" } as React.CSSProperties;
  Object.assign(style, fontStyles, { "--detail-amenities-text": config.amenitiesTextColor, "--detail-amenities-background": config.amenitiesBackgroundColor, "--detail-share-facebook": config.shareFacebookColor, "--detail-share-instagram": config.shareInstagramColor, "--detail-share-whatsapp": config.shareWhatsappColor, "--detail-share-x": config.shareXColor, "--detail-share-linkedin": config.shareLinkedinColor });
  if (state === "loading") return <DetailSkeleton config={config} style={style} lang={lang} dir={dir} />;
  if (!listing) return <div className={`${styles.root} ${styles.message}`} style={style} lang={lang} dir={dir}>{state === "missing" ? t(lang, "noPropertySelected") : state === "not-found" ? t(lang, "propertyGone") : t(lang, "propertyUnavailable")}</div>;
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
      showSiteToast(next ? t(lang, "propertySaved") : t(lang, "propertyRemoved"), next ? t(lang, "savedFind") : t(lang, "removedFromList"), "success", dismissToast);
    } catch (error) {
      setSaved(previous);
      console.error("Unable to update saved property.", error);
      showSiteToast(error instanceof Error && error.message === "login-required" ? t(lang, "signInToSave") : t(lang, "couldNotUpdateSaved"), t(lang, "tryAgain"), "error", dismissToast);
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
      showSiteToast(t(lang, "signInToSave"), t(lang, "tryAgain"), "error", dismissToast);
    });
  };
  const panoramas = getPanoramaImages(listing);
  return <article className={styles.root} style={style} lang={lang} dir={dir}><div className={styles.detailCard} style={{ borderRadius: `${config.cardRadius}px` }}><ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} lang={lang} /><div className={styles.content}><button type="button" className={styles.backButton} onClick={() => void goToProperties()}><ArrowLeft /> {t(lang, "backToProperties")}</button><div className={styles.heading}><div><h1>{listing.title}</h1>{config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing, t(lang, "locationNotSet"))}</p> : null}</div><div className={styles.priceRow}><div className={styles.price}>{formatListingPrice(listing, locale)}</div><button type="button" className={styles.quoteButton} onClick={() => setQuoteOpen(true)}>{t(lang, "requestQuote")}</button><button type="button" className={styles.saveButton} onClick={() => void handleSave()} aria-busy={saving} aria-label={saved ? t(lang, "removeProperty") : t(lang, "saveProperty")} aria-pressed={saved}>{saved ? <BookmarkCheck /> : <Bookmark />}</button></div></div>{config.showViewCount ? <div className={styles.views}><Eye /> {t(lang, "views", { count: viewCount ?? listing.viewCount ?? 0 })}</div> : null}{config.showSocialShare && access.socialShare ? <PropertySocialShare listing={listing} lang={lang} locale={locale} /> : null}{config.showAiAssistant && access.assistant ? <PropertyAssistant listing={listing} lang={lang} /> : null}{panoramas.length ? <section className={styles.section}><h2>{t(lang, "virtualTour")}</h2><PanoramaViewer images={panoramas} title={listing.title} lang={lang} /></section> : null}{config.showDescription && listing.description ? <div className={styles.description} dangerouslySetInnerHTML={{ __html: listing.description }} /> : null}<div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {t(lang, "bedrooms", { count: listing.bedrooms })}</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {t(lang, "bathrooms", { count: listing.bathrooms })}</span> : null}<span><Ruler /> {listing.area.toLocaleString(locale)} {listing.areaUnit}</span></div>{config.showLocation ? <section className={styles.section}><h2>{t(lang, "location")}</h2><PropertyMap listing={listing} lang={lang} /></section> : null}{config.showAmenities && listing.amenities?.length ? <section className={styles.section}><h2>{t(lang, "amenities")}</h2><ul>{listing.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul></section> : null}{config.showAgent ? <ListingContact listing={listing} lang={lang} /> : null}</div></div>{config.showFeaturedListings && access.relatedListings && featuredListings.length ? <section className={styles.featuredSection} aria-label={config.featuredTitle}><header className={styles.featuredHeader}><div><h2>{config.featuredTitle}</h2><p>{config.featuredSubtitle}</p></div><div className={styles.featuredControls}><button type="button" aria-label={t(lang, "previousRelated")} onClick={() => document.getElementById("featured-properties")?.scrollBy({ left: -320, behavior: "smooth" })}><ChevronLeft /></button><button type="button" aria-label={t(lang, "nextRelated")} onClick={() => document.getElementById("featured-properties")?.scrollBy({ left: 320, behavior: "smooth" })}><ChevronRight /></button></div></header><div id="featured-properties" className={styles.featuredList} style={{ gap: `${config.featuredGap}px` }}>{featuredListings.map((item) => <FeaturedCard key={item._id} listing={item} config={config} saved={featuredSavedIds.has(item._id)} lang={lang} locale={locale} onSave={handleFeaturedSave} />)}</div></section> : null}{quoteOpen ? <QuoteRequestModal listing={listing} lang={lang} onClose={() => setQuoteOpen(false)} /> : null}</article>;
};

export default reactToWebComponent(PropertyDetail, React, ReactDOM as any, { props: { config: "string" } });
