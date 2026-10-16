import { PropertyAttachments } from "../../widgets/property-detail-widget/property-attachments";
import { ComparisonScope } from '../../comparison/comparison-runtime';
import { ComparisonButton, ComparisonSpace } from '../../comparison/comparison-button';
import React, { lazy, Suspense, useMemo, useRef, type FC } from 'react';
import classNames from 'classnames';
import { useReducedMotion, useLanguageDirection } from '@wix/react-component-utils';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_DETAIL_WIDGET_CONFIG, formatListingPrice, getImageUrls, getListingLocation } from '../../../../lib/site-widget';
import { optimizeDescriptionImages } from '../../../../lib/description-images';
import { getPanoramaImages } from '../../../../lib/listing-types';
import { t } from '../../../../lib/widget-i18n';
import { usePropertyDetail, loadPublicListings } from '../../widgets/property-detail-widget/use-property-detail';
import { PropertyAssistant } from '../../widgets/property-detail-widget/property-assistant';
import { PropertySocialShare } from '../../widgets/property-detail-widget/social-share';
import { MortgageCalculator } from '../../widgets/property-detail-widget/mortgage-calculator';
import { PanoramaViewer } from '../../widgets/property-detail-widget/panorama-viewer';
import { PropertyVideos } from '../../widgets/property-detail-widget/property-videos';
import { PROPERTIES_PAGE_PATH, navigateBack, navigateTo, onSiteLinkClick } from '../../../../lib/site-navigation';
import { Gallery } from '../property-parts/gallery';
import { propertyUrl, useDesignMode, accessibilityAttributes, useSafeCurrentUrl, useSafeSiteUrl } from '../property-parts/runtime';
import type { PropertyDetailProps } from './property-detail.props';
import styles from './property-detail.module.css';
import richContentStyles from '../../widgets/property-detail-widget/property-detail-widget.module.css';

const PropertyMap = lazy(() => import('../../widgets/property-detail-widget/property-map').then((module) => ({ default: module.PropertyMap })));

const PropertyDetail: FC<PropertyDetailProps> = (props) => {
  const { id, className, direction, a11y, elementProps, detailPage } = props;
  const currentUrl = useSafeCurrentUrl();
  const siteUrl = useSafeSiteUrl();
  const designMode = useDesignMode();
  const reducedMotion = useReducedMotion();
  const siteDirection = useLanguageDirection();
  const url = props.listingId ? propertyUrl(siteUrl, detailPage.href ?? '/property-details', props.listingId) : currentUrl;
  const config = useMemo(() => ({ ...DEFAULT_DETAIL_WIDGET_CONFIG,
    language: props.language, showFeaturedListings: props.enableRelatedListings,
    featuredCount: Math.min(8, Math.max(1, Math.round(props.relatedCount))),
    showAiAssistant: props.enableAssistant, showSocialShare: props.enableSocialShare,
    showMortgageCalculator: props.enableMortgageCalculator,
  }), [props.language, props.enableRelatedListings, props.relatedCount, props.enableAssistant, props.enableSocialShare, props.enableMortgageCalculator]);
  const data = usePropertyDetail(config, url, designMode);
  const { lang, locale, access, viewCount, state, saved, saving, handleSave, featuredSavedIds, handleFeaturedSave } = data;
  const allowed = state !== 'locked';
  const listing = allowed ? data.listing : null;
  const featuredListings = allowed ? data.featuredListings : [];
  const relatedRef = useRef<HTMLDivElement | null>(null);
  // No active plan (locked): stay in the loading state rather than showing an error.
  const busy = state === 'loading' || state === 'locked';
  const panoramas = listing && access.virtualTour ? getPanoramaImages(listing) : [];
  const phone = listing?.agentPhone?.replace(/[^\d+]/g, '') ?? '';
  const message = busy ? t(lang, 'loadingProperty') : state === 'missing' ? t(lang, 'noPropertySelected') : state === 'not-found' ? t(lang, 'propertyGone') : state === 'error' ? t(lang, 'propertyUnavailable') : '';
  const scrollRelated = (delta: number) => relatedRef.current?.scrollBy({ left: ((direction ?? siteDirection) === 'rtl' ? -delta : delta), behavior: reducedMotion ? 'instant' : 'smooth' });
  const Root = (a11y?.tag ?? 'article') as React.ElementType;
  return <ComparisonScope enabled={allowed && !designMode && props.enableComparison} siteUrl={siteUrl} lang={lang} locale={locale} onView={(listingId) => {
    const destination = propertyUrl(siteUrl, detailPage.href ?? '/property-details', listingId);
    if (detailPage.target === '_blank') window.open(destination, '_blank', 'noopener,noreferrer');
    else void navigateTo(destination);
  }}><Root id={id} dir={direction} lang={lang} aria-busy={busy}
    {...accessibilityAttributes(a11y)}
    className={classNames('property-detail', styles.root, styles.fallbackDirection, className)}>
    <output {...elementProps?.message} className={classNames('property-detail-message', styles.message, elementProps?.message?.className)} hidden={!message} role={state === 'error' ? 'alert' : undefined}>{message}</output>
    <div {...elementProps?.card} className={classNames('property-detail-card', styles.card, elementProps?.card?.className)} hidden={!busy && !listing}>
      <Gallery className={classNames('property-detail-gallery', styles.gallery, elementProps?.gallery?.className)} images={listing ? getImageUrls(listing) : []} title={listing?.title ?? ''} lang={lang} elementProps={{ image: elementProps?.image, control: elementProps?.imageControl, dots: elementProps?.imageDots }} />
      <div {...elementProps?.content} className={classNames('property-detail-content', styles.content, elementProps?.content?.className)}>
        <a {...elementProps?.backLink} className={classNames('property-detail-back-link', styles.backLink, elementProps?.backLink?.className)} href={propertyUrl(siteUrl, PROPERTIES_PAGE_PATH)} onClick={(event) => {
          if (designMode) { event.preventDefault(); return; }
          // Back to the previous page, or the /properties page when there is none.
          onSiteLinkClick(event, () => navigateBack(PROPERTIES_PAGE_PATH));
        }}>{t(lang, 'back')}</a>
        <div className={styles.headingRow}>
          <div className={styles.titleGroup}>
            <h1 {...elementProps?.heading} className={classNames('property-detail-heading', styles.heading, elementProps?.heading?.className)}>{listing?.title ?? '\u00a0'}</h1>
            <p {...elementProps?.location} className={classNames('property-detail-location', styles.location, elementProps?.location?.className)}>{listing ? getListingLocation(listing, t(lang, 'locationNotSet')) : '\u00a0'}</p>
          </div>
          <div className={styles.priceRow}>
            <strong {...elementProps?.price} className={classNames('property-detail-price', styles.price, elementProps?.price?.className)}>{listing ? formatListingPrice(listing, locale) : '\u00a0'}</strong>
            <ComparisonButton {...elementProps?.compare} className={classNames('property-detail-compare', styles.compare, elementProps?.compare?.className)} listing={listing} lang={lang} disabled={designMode || !allowed} hidden={!props.enableComparison} />
            <button {...elementProps?.save} className={classNames('property-detail-save', styles.save, saved && 'property-detail-save--saved', elementProps?.save?.className)} type="button" onClick={() => void handleSave()} disabled={designMode || !listing || saving} aria-busy={saving} aria-pressed={saved} aria-label={t(lang, saved ? 'removeProperty' : 'saveProperty')}>
              {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <p {...elementProps?.views} className={classNames('property-detail-views', styles.views, elementProps?.views?.className)}>{listing ? t(lang, 'views', { count: viewCount ?? listing.viewCount ?? 0 }) : '\u00a0'}</p>
        <div {...elementProps?.share} className={classNames('property-detail-share', styles.section, elementProps?.share?.className)} hidden={!props.enableSocialShare || !access.socialShare}>
          {listing && props.enableSocialShare && access.socialShare ? <PropertySocialShare listing={listing} lang={lang} locale={locale} pageUrl={url} disabled={designMode} /> : null}
        </div>
        <div {...elementProps?.assistant} className={classNames('property-detail-assistant', styles.section, elementProps?.assistant?.className)} hidden={!props.enableAssistant || !access.assistant}>
          {listing && props.enableAssistant && access.assistant ? <PropertyAssistant listing={listing} lang={lang} disabled={designMode} /> : null}
        </div>
        <section {...elementProps?.tour} className={classNames('property-detail-tour', styles.section, elementProps?.tour?.className)} hidden={panoramas.length === 0}>
          <h2 className={styles.sectionTitle}>{t(lang, 'virtualTour')}</h2>
          {listing && panoramas.length ? <PanoramaViewer images={access.multiSceneTour ? panoramas : panoramas.slice(0, 1)} title={listing.title} lang={lang} /> : null}
        </section>
        <section {...elementProps?.videos} className={classNames('property-detail-videos', styles.section, elementProps?.videos?.className)} hidden={!props.enableVideos || !listing?.videos?.length}>
          <h2 className={styles.sectionTitle}>{t(lang, 'videoTour')}</h2>
          {listing && props.enableVideos && listing.videos?.length ? <PropertyVideos key={listing._id} videos={listing.videos} lang={lang} disabled={designMode} /> : null}
        </section>
        <div {...elementProps?.description} className={classNames('property-detail-description', richContentStyles.description, styles.description, elementProps?.description?.className)} dangerouslySetInnerHTML={{ __html: optimizeDescriptionImages(listing?.description ?? '') }} />
        <p {...elementProps?.metadata} className={classNames('property-detail-metadata', styles.metadata, elementProps?.metadata?.className)}>{listing ? [listing.bedrooms === undefined ? '' : t(lang, 'bedrooms', { count: listing.bedrooms }), listing.bathrooms === undefined ? '' : t(lang, 'bathrooms', { count: listing.bathrooms }), `${listing.area.toLocaleString(locale)} ${listing.areaUnit}`].filter(Boolean).join(' · ') : '\u00a0'}</p>
        <div {...elementProps?.mortgage} className={classNames('property-detail-mortgage', styles.section, elementProps?.mortgage?.className)} hidden={!props.enableMortgageCalculator || !access.mortgageCalculator || listing?.transactionType !== 'sale'}>
          {listing?.transactionType === 'sale' && props.enableMortgageCalculator && access.mortgageCalculator ? <MortgageCalculator key={listing._id} listing={listing} lang={lang} locale={locale} /> : null}
        </div>
        <section {...elementProps?.map} className={classNames('property-detail-map', styles.section, elementProps?.map?.className)}>
          <h2 className={styles.sectionTitle}>{t(lang, 'location')}</h2>
          {listing ? <Suspense fallback={<p>{t(lang, 'loading')}</p>}><PropertyMap listing={listing} lang={lang} loadNearby={loadPublicListings} /></Suspense> : null}
        </section>
        <section {...elementProps?.amenities} className={classNames('property-detail-amenities', styles.section, elementProps?.amenities?.className)} hidden={!busy && !listing?.amenities?.length}>
          <h2 className={styles.sectionTitle}>{t(lang, 'amenities')}</h2>
          <ul className={styles.amenityList}>{listing?.amenities?.map((amenity) => <li key={amenity} className={styles.amenity}>{amenity}</li>)}</ul>
        </section>
        {listing ? <PropertyAttachments key={listing._id} listing={listing} lang={lang} showFloorPlans={props.enableFloorPlans} showBrochures={props.enableBrochures} disabled={designMode} /> : null}
        <section {...elementProps?.contact} className={classNames('property-detail-contact', styles.section, elementProps?.contact?.className)} hidden={!busy && !listing?.agentName && !phone && !listing?.agentEmail}>
          <h2 className={styles.sectionTitle}>{t(lang, 'contact')}</h2>
          <p className={styles.contactName}>{listing?.agentName}</p>
          <a {...elementProps?.contactLink} className={classNames('property-detail-contact-link', styles.contactLink, elementProps?.contactLink?.className)} hidden={!phone} href={`tel:${phone}`} onClick={(event) => { if (designMode) event.preventDefault(); }}>{listing?.agentPhone}</a>
          <a {...elementProps?.contactLink} className={classNames('property-detail-contact-link', styles.contactLink, elementProps?.contactLink?.className)} hidden={!listing?.agentEmail} href={`mailto:${listing?.agentEmail ?? ''}`} onClick={(event) => { if (designMode) event.preventDefault(); }}>{listing?.agentEmail}</a>
        </section>
      </div>
    </div>
    <section {...elementProps?.related} className={classNames('property-detail-related', styles.related, elementProps?.related?.className)} hidden={!props.enableRelatedListings || (!busy && (!access.relatedListings || featuredListings.length === 0))}>
      <header className={styles.relatedHeader}>
        <div>
          <h2 {...elementProps?.relatedTitle} className={classNames('property-detail-related-title', styles.relatedTitle, elementProps?.relatedTitle?.className)}>{props.relatedTitle}</h2>
          <p {...elementProps?.relatedSubtitle} className={classNames('property-detail-related-subtitle', styles.relatedSubtitle, elementProps?.relatedSubtitle?.className)}>{props.relatedSubtitle}</p>
        </div>
        <div className={styles.relatedControls}>
          <button {...elementProps?.relatedControl} className={classNames('property-detail-related-control', styles.relatedControl, elementProps?.relatedControl?.className)} type="button" onClick={() => scrollRelated(-320)} disabled={busy} aria-label={t(lang, 'previousRelated')}><ChevronLeft size={16} aria-hidden="true" /></button>
          <button {...elementProps?.relatedControl} className={classNames('property-detail-related-control', styles.relatedControl, elementProps?.relatedControl?.className)} type="button" onClick={() => scrollRelated(320)} disabled={busy} aria-label={t(lang, 'nextRelated')}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      </header>
      <div ref={relatedRef} {...elementProps?.relatedList} className={classNames('property-detail-related-list', styles.relatedList, elementProps?.relatedList?.className)}>
        {(busy ? Array.from({ length: config.featuredCount }, () => null) : featuredListings).map((item, index) => <article key={item?._id ?? `loading-${index}`} {...elementProps?.relatedCard} className={classNames('property-detail-related-card', styles.relatedCard, elementProps?.relatedCard?.className)} aria-hidden={!item || undefined}>
          <Gallery images={item ? getImageUrls(item) : []} title={item?.title ?? ''} lang={lang} />
          <div className={styles.relatedBody}>
            <a {...elementProps?.relatedLink} className={classNames('property-detail-related-link', styles.relatedLink, elementProps?.relatedLink?.className)} href={item ? propertyUrl(siteUrl, detailPage.href ?? '/property-details', item._id) : undefined} target={detailPage.target} rel={detailPage.rel} onClick={(event) => {
              if (designMode || !item) { event.preventDefault(); return; }
              const href = event.currentTarget.href;
              onSiteLinkClick(event, () => navigateTo(href));
            }}>{item?.title ?? '\u00a0'}</a>
            <p className={styles.price}>{item ? formatListingPrice(item, locale) : '\u00a0'}</p>
            <p className={styles.location}>{item ? getListingLocation(item, t(lang, 'locationNotSet')) : '\u00a0'}</p>
            <p className={styles.metadata}>{item ? [item.bedrooms === undefined ? '' : t(lang, 'bedroomsShort', { count: item.bedrooms }), item.bathrooms === undefined ? '' : t(lang, 'bathroomsShort', { count: item.bathrooms }), `${item.area.toLocaleString(locale)} ${item.areaUnit}`].filter(Boolean).join(' · ') : '\u00a0'}</p>
            <ComparisonButton {...elementProps?.compare} className={classNames('property-detail-compare', styles.compare, elementProps?.compare?.className)} listing={item} lang={lang} disabled={designMode || !allowed} hidden={!props.enableComparison} />
            <button {...elementProps?.save} className={classNames('property-detail-save', styles.save, elementProps?.save?.className)} type="button" onClick={() => { if (item) handleFeaturedSave(item._id); }} disabled={designMode || !item} aria-pressed={Boolean(item && featuredSavedIds.has(item._id))} aria-label={t(lang, item && featuredSavedIds.has(item._id) ? 'removeProperty' : 'saveProperty')}>
              {item && featuredSavedIds.has(item._id) ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
            </button>
          </div>
        </article>)}
      </div>
    </section>
    <ComparisonSpace />
  </Root></ComparisonScope>;
};

export default PropertyDetail;
