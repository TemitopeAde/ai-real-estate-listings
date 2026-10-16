import React, { useEffect, useId, useRef, useState } from "react";
import { httpClient } from "@wix/essentials";
import type { Listing, ListingDocument, ListingImage } from "../../../../lib/listing-types";
import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-attachments.module.css";

interface Props {
  listing: Listing;
  lang: WidgetLangCode;
  showFloorPlans?: boolean;
  showBrochures?: boolean;
  disabled?: boolean;
}

function PlanImage({ image, lang, enlarged = false }: { image: ListingImage; lang: WidgetLangCode; enlarged?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <output>{t(lang, "floorPlanUnavailable")}</output> :
    <img className={enlarged ? styles.enlarged : styles.thumbnail} src={image.url} alt={image.title || t(lang, "floorPlans")} loading={enlarged ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}

function FloorPlanViewer({ images, initialIndex, lang, onClose, opener }: { images: ListingImage[]; initialIndex: number; lang: WidgetLangCode; onClose: () => void; opener: HTMLElement | null }) {
  const [index, setIndex] = useState(initialIndex);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); if (opener?.isConnected) opener.focus(); };
  }, [opener]);
  const image = images[index];
  const move = (delta: number) => setIndex((current) => (current + delta + images.length) % images.length);
  return <dialog ref={dialog} className={styles.viewer} aria-labelledby={titleId} onCancel={onClose} onClose={onClose} onKeyDown={(event) => {
    if (images.length < 2) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
  }}>
    <div className={styles.viewerHeader}><h2 id={titleId}>{image?.title || t(lang, "floorPlans")}</h2><button type="button" className={styles.control} onClick={onClose}>{t(lang, "closeFloorPlan")}</button></div>
    {image ? <PlanImage key={image.url} image={image} lang={lang} enlarged /> : null}
    {images.length > 1 ? <div className={styles.viewerControls}>
      <button type="button" className={styles.control} onClick={() => move(-1)}>{t(lang, "previousFloorPlan")}</button>
      <span aria-live="polite">{t(lang, "floorPlanCount", { current: index + 1, total: images.length })}</span>
      <button type="button" className={styles.control} onClick={() => move(1)}>{t(lang, "nextFloorPlan")}</button>
    </div> : null}
  </dialog>;
}

function BrochureDownload({ document, listingId, lang, disabled }: { document: ListingDocument; listingId: string; lang: WidgetLangCode; disabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function download() {
    setPending(true); setFailed(false);
    // Open the tab during the click so it isn't blocked as a popup once the URL arrives.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const origin = new URL(import.meta.url).origin;
      const response = await httpClient.fetchWithAuth(`${origin}/api/public-listings/brochure-download`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, fileId: document.id }) });
      if (!response.ok) throw new Error("Brochure download unavailable.");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string" || new URL(data.url).protocol !== "https:") throw new Error("Invalid download response.");
      if (tab) tab.location.href = data.url;
      else window.location.assign(data.url);
    } catch (error) { tab?.close(); console.error("Unable to download brochure.", error); setFailed(true); }
    finally { setPending(false); }
  }
  return <li className={styles.brochure}>
    <div className={styles.documentName}><strong>{document.title || document.filename}</strong><span className={styles.filename}>{document.filename}</span></div>
    <button type="button" className={styles.control} disabled={disabled || pending} aria-busy={pending} onClick={() => void download()}>{t(lang, pending ? "downloadingPdf" : "downloadPdf")}</button>
    {failed ? <p className={styles.error} role="alert">{t(lang, "brochureDownloadFailed")}</p> : null}
  </li>;
}

export function PropertyAttachments({ listing, lang, showFloorPlans = true, showBrochures = true, disabled = false }: Props) {
  const plans = listing.floorPlans ?? [];
  const brochures = listing.brochures ?? [];
  const [selected, setSelected] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  return <>
    {showFloorPlans && plans.length ? <section className={styles.section}>
      <h2>{t(lang, "floorPlans")}</h2>
      <ul className={styles.plans}>{plans.map((image, index) => <li key={image.id || image.url}>
        <button type="button" className={styles.plan} disabled={disabled} onClick={(event) => { opener.current = event.currentTarget; setSelected(index); }}>
          <PlanImage image={image} lang={lang} /><span>{image.title || t(lang, "floorPlanLabel", { number: index + 1 })}</span>
        </button>
      </li>)}</ul>
      {selected !== null && !disabled ? <FloorPlanViewer images={plans} initialIndex={selected} lang={lang} onClose={() => setSelected(null)} opener={opener.current} /> : null}
    </section> : null}
    {showBrochures && brochures.length ? <section className={styles.section}>
      <h2>{t(lang, "brochures")}</h2>
      <ul className={styles.brochures}>{brochures.map((document) => <BrochureDownload key={document.id} document={document} listingId={listing._id} lang={lang} disabled={disabled} />)}</ul>
    </section> : null}
  </>;
}
