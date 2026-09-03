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

import type { Listing } from "../../../../lib/listing-types";
import { DEFAULT_DETAIL_WIDGET_CONFIG, formatListingPrice, getImageUrls, getListingLocation, parseWidgetJson, type DetailWidgetConfig } from "../../../../lib/site-widget";
import styles from "./property-detail-widget.module.css";

interface Props { config?: string; }
const apiOrigin = new URL(import.meta.url).origin;

async function goToProperties(): Promise<void> {
  const baseUrl = await location.baseUrl();
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  await location.to(`${cleanBaseUrl}/properties`);
}

async function loadListing(id: string): Promise<Listing> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?id=${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(response.status === 404 ? "not-found" : "load-failed");
  return await response.json() as Listing;
}

async function loadPublicListings(): Promise<Listing[]> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing`, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data: unknown = await response.json();
  return Array.isArray(data) ? data as Listing[] : [];
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

type InvoiceRequestFormProps = { listing: Listing; onClose: () => void };
type InvoiceRequestFormState = { firstName: string; lastName: string; email: string; phone: string; country: string; state: string; city: string; postalCode: string; streetAddress: string; message: string };

const InvoiceRequestForm: FC<InvoiceRequestFormProps> = ({ listing, onClose }) => {
  const [form, setForm] = useState<InvoiceRequestFormState>({ firstName: '', lastName: '', email: '', phone: '', country: '', state: '', city: '', postalCode: '', streetAddress: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (key: keyof InvoiceRequestFormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/invoice-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, listingId: listing._id, listingTitle: listing.title }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Your invoice request could not be submitted.');
      setSubmitted(true);
    } catch (reason) {
      console.error('Unable to submit invoice request.', reason);
      setError(reason instanceof Error ? reason.message : 'Your invoice request could not be submitted.');
    } finally { setSubmitting(false); }
  };
  const fields: Array<[keyof InvoiceRequestFormState, string, string]> = [['firstName', 'First name', 'text'], ['lastName', 'Last name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['country', 'Country code', 'text'], ['state', 'State or province', 'text'], ['city', 'City', 'text'], ['postalCode', 'Postal code', 'text'], ['streetAddress', 'Street address', 'text']];
  return <div className={styles.quoteOverlay} role="presentation"><section className={styles.quoteModal} role="dialog" aria-modal="true" aria-labelledby="invoice-request-title"><button type="button" className={styles.quoteClose} onClick={onClose} aria-label="Close invoice request">×</button>{submitted ? <div className={styles.quoteSuccess}><h2 id="invoice-request-title">Request received</h2><p>An agent will review your details and prepare an invoice for {listing.title}.</p><button type="button" className={styles.quoteSubmit} onClick={onClose}>Done</button></div> : <form onSubmit={(event) => void submit(event)}><h2 id="invoice-request-title">Request an invoice</h2><p className={styles.quoteIntro}>Provide your billing details for {listing.title}.</p><div className={styles.quoteFields}>{fields.map(([key, label, type]) => <label key={key}>{label}<input required value={form[key]} type={type} onChange={(event) => update(key, event.target.value)} /></label>)}<label className={styles.quoteMessage}>Message<textarea value={form.message} onChange={(event) => update('message', event.target.value)} /></label></div>{error ? <p className={styles.quoteError} role="alert">{error}</p> : null}<button type="submit" className={styles.quoteSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit invoice request'}</button></form>}</section></div>;
};

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

const PanoramaViewer: FC<{ imageUrl: string; title: string }> = ({ imageUrl, title }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup = () => undefined;
    void Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]).then(([THREE, controlsModule]) => {
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.set(0, 0, 0.01);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.minDistance = 0.01;
      controls.maxDistance = 0.1;

      const geometry = new THREE.SphereGeometry(10, 64, 32);
      const texture = new THREE.TextureLoader().load(imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
      scene.add(new THREE.Mesh(geometry, material));

      const resize = () => {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

      let animationFrame = 0;
      const render = () => {
        controls.update();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(render);
      };
      animationFrame = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        controls.dispose();
        geometry.dispose();
        texture.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch((error: unknown) => {
      console.error("Unable to load the 360° panorama viewer.", error);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [imageUrl]);

  return <div ref={containerRef} className={styles.panorama} aria-label={`Interactive 360° panorama of ${title}`} />;
};

const DetailSkeleton: FC<{ config: DetailWidgetConfig; style: React.CSSProperties }> = ({ config, style }) => (
  <article className={`${styles.root} ${styles.skeletonRoot}`} style={{
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
      void loadPublicListings().then((properties) => { nearbyListings = properties.filter((property) => property.status === "active"); updateVisibleProperties(); }).catch((error) => console.error("Unable to load nearby properties.", error));
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

const PropertyDetail: FC<Props> = ({ config: rawConfig }) => {
  const config = useMemo(() => parseWidgetJson(rawConfig ?? null, DEFAULT_DETAIL_WIDGET_CONFIG), [rawConfig]);
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const [listing, setListing] = useState<Listing | null>(null);
  const [viewCount, setViewCount] = useState<number | undefined>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceRequestOpen, setInvoiceRequestOpen] = useState(false);
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
  const style = { "--detail-background": config.backgroundColor, "--detail-card": config.cardColor, "--detail-text": config.textColor, "--detail-muted": config.mutedColor, "--detail-accent": config.accentColor, "--detail-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--detail-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--detail-border-width": `${config.cardBorderWidth}px`, "--detail-border-color": config.cardBorderColor, "--detail-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)", font: config.bodyFont.font } as React.CSSProperties;
  Object.assign(style, fontStyles, { "--detail-amenities-text": config.amenitiesTextColor, "--detail-amenities-background": config.amenitiesBackgroundColor });
  if (state === "loading") return <DetailSkeleton config={config} style={style} />;
  if (!listing) return <div className={`${styles.root} ${styles.message}`} style={style}>{state === "missing" ? "No property was selected." : state === "not-found" ? "This property is no longer available." : "The property is temporarily unavailable."}</div>;
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      try { await savedAction(saved ? "remove" : "save", listing._id); } catch (error) {
        if (!(error instanceof Error) || error.message !== "login-required") throw error;
        await authentication.promptLogin();
        await savedAction("save", listing._id);
      }
      const next = !saved;
      setSaved(next);
      window.dispatchEvent(new CustomEvent("saved-properties:changed", { detail: { listingId: listing._id, saved: next } }));
      showSiteToast(next ? "Property saved" : "Property removed", next ? "You can find it in your saved properties." : "The property was removed from your saved list.");
    } catch (error) { console.error("Unable to update saved property.", error); showSiteToast(error instanceof Error && error.message === "login-required" ? "Sign in to save properties" : "Could not update saved property", "Please try again.", "error"); } finally { setSaving(false); }
  };
  return <article className={styles.root} style={style}><div className={styles.detailCard} style={{ borderRadius: `${config.cardRadius}px` }}><ImageCarousel listing={listing} ratio={config.imageRatio} /><div className={styles.content}><button type="button" className={styles.backButton} onClick={() => void goToProperties()}><ArrowLeft /> Back to properties</button><div className={styles.heading}><div><h1 style={{ font: config.titleFont.font }}>{listing.title}</h1>{config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing)}</p> : null}</div><div className={styles.priceRow}><div className={styles.price}>{formatListingPrice(listing)}</div><button type="button" className={styles.invoiceButton} onClick={() => setInvoiceRequestOpen(true)}>Request an invoice</button><button type="button" className={styles.saveButton} onClick={() => void handleSave()} disabled={saving} aria-label={saved ? "Remove property from saved properties" : "Save property"} aria-pressed={saved}>{saved ? <BookmarkCheck /> : <Bookmark />}</button></div></div>{config.showViewCount ? <div className={styles.views}><Eye /> {viewCount ?? listing.viewCount} views</div> : null}{listing.panoramaImage ? <section className={styles.section}><h2>360° virtual tour</h2><PanoramaViewer imageUrl={listing.panoramaImage} title={listing.title} /></section> : null}{config.showDescription && listing.description ? <div className={styles.description} dangerouslySetInnerHTML={{ __html: listing.description }} /> : null}<div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {listing.bedrooms} bedrooms</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {listing.bathrooms} bathrooms</span> : null}<span><Ruler /> {listing.area.toLocaleString()} {listing.areaUnit}</span></div>{config.showLocation ? <section className={styles.section}><h2>Location</h2><PropertyMap listing={listing} /></section> : null}{config.showAmenities && listing.amenities?.length ? <section className={styles.section}><h2>Amenities</h2><ul>{listing.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul></section> : null}{config.showAgent && listing.agentName ? <section className={styles.section}><h2>Contact</h2><p className={styles.agent}>{listing.agentName}{listing.agentPhone ? ` · ${listing.agentPhone}` : ""}{listing.agentEmail ? ` · ${listing.agentEmail}` : ""}</p></section> : null}</div></div>{invoiceRequestOpen ? <InvoiceRequestForm listing={listing} onClose={() => setInvoiceRequestOpen(false)} /> : null}</article>;
};

export default reactToWebComponent(PropertyDetail, React, ReactDOM as any, { props: { config: "string" } });
