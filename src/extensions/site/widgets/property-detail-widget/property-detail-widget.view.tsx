import { PropertyAttachments } from "./property-attachments";
import { PropertyVideos } from "./property-videos";
import { PROPERTIES_PAGE_PATH, navigateBack, navigateTo } from "../../../../lib/site-navigation";
import { ComparisonScope } from '../../comparison/comparison-runtime';
import { ComparisonButton, ComparisonSpace } from '../../comparison/comparison-button';
import { usePropertyDetail, loadPublicListings } from "./use-property-detail";
import React, { Fragment, lazy, Suspense, useMemo, useRef, useState, type FC } from "react";
import { httpClient } from "@wix/essentials";
import { location } from "@wix/site-location";
import { ArrowLeft, Bath, BedDouble, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Eye, MapPin, Ruler } from "lucide-react";
import { useWidgetFonts } from "../widget-fonts";
import { getPanoramaImages, type Listing } from "../../../../lib/listing-types";
import { PropertyAssistant } from "./property-assistant";
import { PanoramaViewer } from "./panorama-viewer";
import { MortgageCalculator } from "./mortgage-calculator";
import { PropertySocialShare } from "./social-share";
import { DEFAULT_DETAIL_WIDGET_CONFIG, formatListingPrice, getImageUrls, getListingLocation, normalizeDetailWidgetConfig, parseWidgetJson, type DetailWidgetConfig } from "../../../../lib/site-widget";
import { t, useResolvedWidgetLanguage, widgetTextDirection, type WidgetLangCode } from "../../../../lib/widget-i18n";
import styles from "./property-detail-widget.module.css";

const QuoteMessageEditor = lazy(() =>
  import("./quote-message-editor").then((module) => ({ default: module.QuoteMessageEditor })),
);
const PropertyMap = lazy(() =>
  import("./property-map").then((module) => ({ default: module.PropertyMap })),
);

function plainFromHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

interface Props { config?: string; }
const apiOrigin = new URL(import.meta.url).origin;

/** Back to the previous page, or the properties page when the visitor arrived directly. */
async function goBack(): Promise<void> {
  await navigateBack(PROPERTIES_PAGE_PATH);
}

async function goToListing(id: string): Promise<void> {
  const baseUrl = await location.baseUrl();
  await navigateTo(`${baseUrl.replace(/\/+$/, "")}/property-details?id=${encodeURIComponent(id)}`);
}

function ListingContact({ listing, lang }: { listing: Listing; lang: WidgetLangCode }) {
  const parts: React.ReactNode[] = [];
  const phone = listing.agentPhone?.replace(/[^\d+]/g, "") ?? "";
  const email = listing.agentEmail?.trim() ?? "";
  if (listing.agentName) parts.push(<span key="name">{listing.agentName}</span>);
  if (/\d/.test(phone)) {
    parts.push(
      <a key="phone" href={`tel:${phone}`} target="_top">
        {listing.agentPhone}
      </a>,
    );
  }
  if (email) {
    parts.push(
      <a key="email" href={`mailto:${email}`} target="_top">
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
    {config.enableComparison ? <ComparisonButton listing={listing} lang={lang} className={styles.compareButton} /> : null}
  </article>
);

const MapFallback: FC<{ lang: WidgetLangCode }> = ({ lang }) => (
  <div className={styles.mapFallback}>{t(lang, "mapUnavailable")}</div>
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

const detailStyle = (config: DetailWidgetConfig) => ({ "--detail-background": config.backgroundColor, "--detail-card": config.cardColor, "--detail-text": config.textColor, "--detail-muted": config.mutedColor, "--detail-accent": config.accentColor, "--detail-padding": `${config.containerPadding.top}px ${config.containerPadding.right}px ${config.containerPadding.bottom}px ${config.containerPadding.left}px`, "--detail-margin": `${config.containerMargin.top}px ${config.containerMargin.right}px ${config.containerMargin.bottom}px ${config.containerMargin.left}px`, "--detail-border-width": `${config.cardBorderWidth}px`, "--detail-border-color": config.cardBorderColor, "--detail-shadow": config.cardShadow === "none" ? "none" : config.cardShadow === "strong" ? "0 18px 42px rgba(23,33,27,.16)" : "0 12px 30px rgba(23,33,27,.08)" } as React.CSSProperties);

const PropertyDetail: FC<Props> = ({ config: rawConfig }) => {
  const config = useMemo(() => normalizeDetailWidgetConfig(parseWidgetJson(rawConfig ?? null, DEFAULT_DETAIL_WIDGET_CONFIG)), [rawConfig]);
  const { lang, locale, dir, listing, access, viewCount, saved, saving, quoteOpen, setQuoteOpen, featuredListings, featuredSavedIds, state, handleSave, handleFeaturedSave } = usePropertyDetail(config);
  const fontStyles = useWidgetFonts(config.titleFont.font, config.bodyFont.font);
  const featuredRef = useRef<HTMLDivElement | null>(null);
  const style = detailStyle(config);
  Object.assign(style, fontStyles, { "--detail-amenities-text": config.amenitiesTextColor, "--detail-amenities-background": config.amenitiesBackgroundColor, "--detail-share-facebook": config.shareFacebookColor, "--detail-share-instagram": config.shareInstagramColor, "--detail-share-whatsapp": config.shareWhatsappColor, "--detail-share-x": config.shareXColor, "--detail-share-linkedin": config.shareLinkedinColor });
  // No active plan: keep the skeleton rather than an error message.
  if (state === "loading" || state === "locked") return <DetailSkeleton config={config} style={style} lang={lang} dir={dir} />;
  if (!listing) return <div className={`${styles.root} ${styles.message}`} style={style} lang={lang} dir={dir}>{state === "missing" ? t(lang, "noPropertySelected") : state === "not-found" ? t(lang, "propertyGone") : t(lang, "propertyUnavailable")}</div>;
  const panoramas = getPanoramaImages(listing);
  return <ComparisonScope enabled={config.enableComparison} lang={lang} locale={locale} onView={goToListing}><article className={styles.root} style={style} lang={lang} dir={dir}><div className={styles.detailCard} style={{ borderRadius: `${config.cardRadius}px` }}><ImageCarousel listing={listing} ratio={config.imageRatio} showImageControls={config.showImageControls} showImageDots={config.showImageDots} lang={lang} /><div className={styles.content}><button type="button" className={styles.backButton} onClick={() => void goBack()}><ArrowLeft /> {t(lang, "back")}</button><div className={styles.heading}><div><h1>{listing.title}</h1>{config.showLocation ? <p className={styles.location}><MapPin /> {getListingLocation(listing, t(lang, "locationNotSet"))}</p> : null}</div><div className={styles.priceRow}><div className={styles.price}>{formatListingPrice(listing, locale)}</div>{config.showQuoteRequest ? <button type="button" className={styles.quoteButton} onClick={() => setQuoteOpen(true)}>{t(lang, "requestQuote")}</button> : null}{config.enableComparison ? <ComparisonButton listing={listing} lang={lang} /> : null}<button type="button" className={styles.saveButton} onClick={() => void handleSave()} aria-busy={saving} aria-label={saved ? t(lang, "removeProperty") : t(lang, "saveProperty")} aria-pressed={saved}>{saved ? <BookmarkCheck /> : <Bookmark />}</button></div></div>{config.showViewCount ? <div className={styles.views}><Eye /> {t(lang, "views", { count: viewCount ?? listing.viewCount ?? 0 })}</div> : null}{config.showSocialShare && access.socialShare ? <PropertySocialShare listing={listing} lang={lang} locale={locale} /> : null}{config.showAiAssistant && access.assistant ? <PropertyAssistant listing={listing} lang={lang} /> : null}{panoramas.length ? <section className={styles.section}><h2>{t(lang, "virtualTour")}</h2><PanoramaViewer images={panoramas} title={listing.title} lang={lang} /></section> : null}{config.showVideos && listing.videos?.length ? <section className={styles.section}><h2>{t(lang, "videoTour")}</h2><PropertyVideos key={listing._id} videos={listing.videos} lang={lang} /></section> : null}{config.showDescription && listing.description ? <div className={styles.description} dangerouslySetInnerHTML={{ __html: listing.description }} /> : null}<div className={styles.metadata}>{listing.bedrooms !== undefined ? <span><BedDouble /> {t(lang, "bedrooms", { count: listing.bedrooms })}</span> : null}{listing.bathrooms !== undefined ? <span><Bath /> {t(lang, "bathrooms", { count: listing.bathrooms })}</span> : null}<span><Ruler /> {listing.area.toLocaleString(locale)} {listing.areaUnit}</span></div>{config.showMortgageCalculator && access.mortgageCalculator && listing.transactionType === "sale" ? <MortgageCalculator listing={listing} lang={lang} locale={locale} /> : null}{config.showLocation ? <section className={styles.section}><h2>{t(lang, "location")}</h2><Suspense fallback={<MapFallback lang={lang} />}><PropertyMap listing={listing} lang={lang} loadNearby={loadPublicListings} /></Suspense></section> : null}{config.showAmenities && listing.amenities?.length ? <section className={styles.section}><h2>{t(lang, "amenities")}</h2><ul>{listing.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul></section> : null}<PropertyAttachments key={listing._id} listing={listing} lang={lang} showFloorPlans={config.showFloorPlans} showBrochures={config.showBrochures} />{config.showAgent ? <ListingContact listing={listing} lang={lang} /> : null}</div></div>{config.showFeaturedListings && access.relatedListings && featuredListings.length ? <section className={styles.featuredSection} aria-label={config.featuredTitle}><header className={styles.featuredHeader}><div><h2>{config.featuredTitle}</h2><p>{config.featuredSubtitle}</p></div><div className={styles.featuredControls}><button type="button" aria-label={t(lang, "previousRelated")} onClick={() => featuredRef.current?.scrollBy({ left: -320, behavior: "smooth" })}><ChevronLeft /></button><button type="button" aria-label={t(lang, "nextRelated")} onClick={() => featuredRef.current?.scrollBy({ left: 320, behavior: "smooth" })}><ChevronRight /></button></div></header><div ref={featuredRef} className={styles.featuredList} style={{ gap: `${config.featuredGap}px` }}>{featuredListings.map((item) => <FeaturedCard key={item._id} listing={item} config={config} saved={featuredSavedIds.has(item._id)} lang={lang} locale={locale} onSave={handleFeaturedSave} />)}</div></section> : null}{quoteOpen ? <QuoteRequestModal listing={listing} lang={lang} onClose={() => setQuoteOpen(false)} /> : null}<ComparisonSpace /></article></ComparisonScope>;
};

export const SubscribedWidget: FC<Props> = PropertyDetail;

