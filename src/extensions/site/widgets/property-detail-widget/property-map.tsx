import { useEffect, useRef, type FC } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, Popup, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Listing } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

export const PropertyMap: FC<{
  listing: Listing;
  lang: WidgetLangCode;
  loadNearby: () => Promise<Listing[]>;
}> = ({ listing, lang, loadNearby }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const coordinates =
    typeof listing.latitude === "number" &&
    Number.isFinite(listing.latitude) &&
    typeof listing.longitude === "number" &&
    Number.isFinite(listing.longitude)
      ? { latitude: listing.latitude, longitude: listing.longitude }
      : undefined;

  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;

  useEffect(() => {
    if (!containerRef.current || latitude === undefined || longitude === undefined) return;
    let nearbyListings: Listing[] = [];
    const map = new MapLibreMap({
      container: containerRef.current,
      center: [longitude, latitude],
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
      void loadNearby().then((properties) => { nearbyListings = properties; updateVisibleProperties(); }).catch((error) => console.error("Unable to load nearby properties.", error));
    });
    new Marker({ color: "#0c3b2e" })
      .setLngLat([longitude, latitude])
      .setPopup(new Popup().setText(listing.title))
      .addTo(map);
    return () => { searchButtonRef.current?.replaceWith(searchButtonRef.current.cloneNode(true)); map.remove(); };
  }, [latitude, longitude, listing.title, listing._id, loadNearby]);

  if (!coordinates) {
    return <div className={styles.mapFallback}>{t(lang, "mapUnavailable")}</div>;
  }
  return <div className={styles.mapWrap}><div ref={containerRef} className={styles.map} aria-label={t(lang, "mapLabel", { title: listing.title })} /><button ref={searchButtonRef} type="button" className={styles.searchAreaButton}>{t(lang, "searchThisArea")}</button></div>;
};
