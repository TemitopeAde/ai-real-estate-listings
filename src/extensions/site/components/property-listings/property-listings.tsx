import { ComparisonScope } from '../../comparison/comparison-runtime';
import { ComparisonButton, ComparisonSpace } from '../../comparison/comparison-button';
import React, { useMemo, type FC } from 'react';
import classNames from 'classnames';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { DEFAULT_LISTING_WIDGET_CONFIG, normalizeListingWidgetConfig, formatListingPrice, getImageUrls, getListingLocation } from '../../../../lib/site-widget';
import { PROPERTY_TYPES, TRANSACTION_TYPES } from '../../../../lib/listing-types';
import { t } from '../../../../lib/widget-i18n';
import { usePropertyListings } from '../../widgets/property-listings-widget/use-property-listings';
import { Gallery } from '../property-parts/gallery';
import { propertyUrl, useDesignMode, accessibilityAttributes, useSafeSiteUrl } from '../property-parts/runtime';
import { navigateTo, onSiteLinkClick } from '../../../../lib/site-navigation';
import type { PropertyListingsProps } from './property-listings.props';
import styles from './property-listings.module.css';

const PropertyListings: FC<PropertyListingsProps> = (props) => {
  const { id, className, direction, a11y, elementProps, title, subtitle, detailPage } = props;
  const designMode = useDesignMode();
  const siteUrl = useSafeSiteUrl();
  const config = useMemo(() => normalizeListingWidgetConfig({ ...DEFAULT_LISTING_WIDGET_CONFIG,
    language: props.language, loadingMode: props.loadingMode, pageSize: props.pageSize,
    showSearch: props.enableSearch, showTransactionFilter: props.enableTransactionFilter,
    showPropertyTypeFilter: props.enablePropertyTypeFilter, showPriceFilter: props.enablePriceFilter,
    showBedroomsFilter: props.enableBedroomsFilter,
  }), [props.language, props.loadingMode, props.pageSize, props.enableSearch, props.enableTransactionFilter, props.enablePropertyTypeFilter, props.enablePriceFilter, props.enableBedroomsFilter]);
  const data = usePropertyListings(config, designMode);
  const { lang, locale, filters, sliderRange, loading, loadingMore, listings, savedIds, error, locked, page, hasNext, totalCount, onSave, updateFilter, resetFilters, loadPage, sentinelRef } = data;
  // No active plan (locked): stay in the loading state rather than showing an error.
  const allowed = !locked;
  const busy = locked || loading;
  const totalPages = Math.max(1, Math.ceil(totalCount / config.pageSize));
  // Keep Next / Load more visible in the Editor so they can still be styled.
  const noMorePages = !designMode && !busy && !loadingMore && !hasNext;
  const firstPage = Math.max(0, Math.min(page - 3, totalPages - 7));
  const pageNumbers = Array.from({ length: Math.min(totalPages, 7) }, (_, index) => firstPage + index);
  const rangeStep = Math.max(1, Math.ceil(sliderRange.maxPrice / 100));
  const minPrice = filters.minPrice ? Number(filters.minPrice) : sliderRange.minPrice;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : sliderRange.maxPrice;
  const message = error ?? (busy ? t(lang, 'loadingProperties') : t(lang, Object.values(filters).some(Boolean) ? 'noMatch' : 'noProperties'));
  const Root = (a11y?.tag ?? 'section') as React.ElementType;
  const openListing = (listingId: string, newTab = false) => {
    const destination = propertyUrl(siteUrl, detailPage.href ?? '/property-details', listingId);
    if (newTab || detailPage.target === '_blank') window.open(destination, '_blank', 'noopener,noreferrer');
    else void navigateTo(destination);
  };
  return <ComparisonScope enabled={allowed && !designMode && props.enableComparison} siteUrl={siteUrl} lang={lang} locale={locale} onView={(listingId) => openListing(listingId)}><Root id={id} dir={direction} lang={lang} aria-label={title} aria-busy={busy || loadingMore}
    {...accessibilityAttributes(a11y)}
    className={classNames('property-listings', styles.root, styles.fallbackDirection, className)}>
    <header className={styles.header}>
      <h2 {...elementProps?.heading} className={classNames('property-listings-heading', styles.heading, elementProps?.heading?.className)}>{title}</h2>
      <p {...elementProps?.subtitle} className={classNames('property-listings-subtitle', styles.subtitle, elementProps?.subtitle?.className)}>{subtitle}</p>
    </header>
    <div {...elementProps?.filters} className={classNames('property-listings-filters', styles.filters, elementProps?.filters?.className)} role="search" aria-label={t(lang, 'filterProperties')}>
      <label className={styles.field} hidden={!props.enableSearch}>
        <span className={styles.visuallyHidden}>{t(lang, 'searchProperties')}</span>
        <input {...elementProps?.search} className={classNames('property-listings-search', styles.input, elementProps?.search?.className)} type="search" value={filters.search} placeholder={t(lang, 'searchProperties')} onChange={(event) => updateFilter('search', event.target.value)} disabled={busy} />
      </label>
      <label className={styles.field} hidden={!props.enableTransactionFilter}>
        <span className={styles.visuallyHidden}>{t(lang, 'transactionType')}</span>
        <select {...elementProps?.select} className={classNames('property-listings-select', styles.input, elementProps?.select?.className)} value={filters.transactionType} onChange={(event) => updateFilter('transactionType', event.target.value)} disabled={busy}>
          <option value="">{t(lang, 'anyListingType')}</option>
          {TRANSACTION_TYPES.map((item) => <option key={item.value} value={item.value}>{t(lang, `transaction.${item.value}`)}</option>)}
        </select>
      </label>
      <label className={styles.field} hidden={!props.enablePropertyTypeFilter}>
        <span className={styles.visuallyHidden}>{t(lang, 'propertyType')}</span>
        <select {...elementProps?.select} className={classNames('property-listings-select', styles.input, elementProps?.select?.className)} value={filters.propertyType} onChange={(event) => updateFilter('propertyType', event.target.value)} disabled={busy}>
          <option value="">{t(lang, 'anyPropertyType')}</option>
          {PROPERTY_TYPES.map((item) => <option key={item.value} value={item.value}>{t(lang, `type.${item.value}`)}</option>)}
        </select>
      </label>
      <label className={styles.field} hidden={!props.enableBedroomsFilter}>
        <span className={styles.visuallyHidden}>{t(lang, 'minBedrooms')}</span>
        <select {...elementProps?.select} className={classNames('property-listings-select', styles.input, elementProps?.select?.className)} value={filters.bedrooms} onChange={(event) => updateFilter('bedrooms', event.target.value)} disabled={busy}>
          <option value="">{t(lang, 'anyBedrooms')}</option>
          {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{t(lang, 'bedroomsPlus', { count })}</option>)}
        </select>
      </label>
      <div className={styles.priceRange} hidden={!props.enablePriceFilter}>
        <span>{t(lang, 'price')} · {sliderRange.currency} {minPrice.toLocaleString(locale)} – {maxPrice.toLocaleString(locale)}</span>
        <label className={styles.rangeField}>
          <span className={styles.visuallyHidden}>{t(lang, 'minPrice')}</span>
          <input {...elementProps?.price} className={classNames('property-listings-price', styles.range, elementProps?.price?.className)} type="range" min={sliderRange.minPrice} max={sliderRange.maxPrice} step={rangeStep} value={minPrice} disabled={busy} onChange={(event) => updateFilter('minPrice', Number(event.target.value) === sliderRange.minPrice ? '' : String(Math.min(Number(event.target.value), maxPrice)))} />
        </label>
        <label className={styles.rangeField}>
          <span className={styles.visuallyHidden}>{t(lang, 'maxPrice')}</span>
          <input {...elementProps?.price} className={classNames('property-listings-price', styles.range, elementProps?.price?.className)} type="range" min={sliderRange.minPrice} max={sliderRange.maxPrice} step={rangeStep} value={maxPrice} disabled={busy} onChange={(event) => updateFilter('maxPrice', Number(event.target.value) === sliderRange.maxPrice ? '' : String(Math.max(Number(event.target.value), minPrice)))} />
        </label>
      </div>
      <button {...elementProps?.reset} className={classNames('property-listings-reset', styles.reset, elementProps?.reset?.className)} type="button" onClick={resetFilters} disabled={busy || !Object.values(filters).some(Boolean)}>{t(lang, 'clear')}</button>
    </div>
    <p {...elementProps?.message} className={classNames('property-listings-message', styles.message, elementProps?.message?.className)} hidden={!busy && listings.length > 0 && !error} role={error ? 'alert' : 'status'}>{message}</p>
    <div {...elementProps?.list} className={classNames('property-listings-list', styles.list, elementProps?.list?.className)}>
      {(busy && !loadingMore ? Array.from({ length: config.pageSize }, () => null) : listings).map((listing, index) => <article key={listing?._id ?? `loading-${index}`} {...elementProps?.card} className={classNames('property-listings-card', styles.card, listing && !designMode && styles.clickableCard, elementProps?.card?.className)} aria-hidden={!listing || undefined}
        onClick={(event) => {
          // The card's own controls (save, compare, gallery, detail link) keep their behaviour.
          if (designMode || !listing || (event.target instanceof Element && event.target.closest('a, button, input, label, select, textarea'))) return;
          openListing(listing._id, event.metaKey || event.ctrlKey);
        }}>
        <Gallery className={classNames('property-listings-gallery', elementProps?.gallery?.className)} images={listing ? getImageUrls(listing) : []} title={listing?.title ?? ''} lang={lang} elementProps={{ image: elementProps?.image, control: elementProps?.imageControl, dots: elementProps?.imageDots }} />
        <button {...elementProps?.save} className={classNames('property-listings-save', styles.save, listing && savedIds.has(listing._id) && 'property-listings-save--saved', elementProps?.save?.className)} type="button" onClick={() => { if (listing) void onSave(listing._id); }} disabled={!listing || designMode} aria-label={t(lang, listing && savedIds.has(listing._id) ? 'removeProperty' : 'saveProperty')} aria-pressed={Boolean(listing && savedIds.has(listing._id))}>
          {listing && savedIds.has(listing._id) ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
        </button>
        <div className={styles.cardBody}>
          <strong {...elementProps?.cardPrice} className={classNames('property-listings-card-price', styles.cardPrice, elementProps?.cardPrice?.className)}>{listing ? formatListingPrice(listing, locale) : '\u00a0'}</strong>
          <h3 {...elementProps?.cardTitle} className={classNames('property-listings-card-title', styles.cardTitle, elementProps?.cardTitle?.className)}>{listing?.title ?? '\u00a0'}</h3>
          <p {...elementProps?.location} className={classNames('property-listings-location', styles.location, elementProps?.location?.className)}>{listing ? getListingLocation(listing, t(lang, 'locationNotSet')) : '\u00a0'}</p>
          <p {...elementProps?.metadata} className={classNames('property-listings-metadata', styles.metadata, elementProps?.metadata?.className)}>{listing ? [listing.bedrooms === undefined ? '' : t(lang, 'bedroomsShort', { count: listing.bedrooms }), listing.bathrooms === undefined ? '' : t(lang, 'bathroomsShort', { count: listing.bathrooms }), `${listing.area.toLocaleString(locale)} ${listing.areaUnit}`].filter(Boolean).join(' · ') : '\u00a0'}</p>
          <ComparisonButton {...elementProps?.compare} className={classNames('property-listings-compare', styles.compare, elementProps?.compare?.className)} listing={listing} lang={lang} disabled={designMode || !allowed} hidden={!props.enableComparison} />
          <a {...elementProps?.detailLink} className={classNames('property-listings-detail-link', styles.detailLink, elementProps?.detailLink?.className)} href={listing ? propertyUrl(siteUrl, detailPage.href ?? '/property-details', listing._id) : undefined} target={detailPage.target} rel={detailPage.rel} onClick={(event) => {
            if (designMode || !listing) { event.preventDefault(); return; }
            const href = event.currentTarget.href;
            onSiteLinkClick(event, () => navigateTo(href));
          }}>{t(lang, 'viewProperty')}</a>
        </div>
      </article>)}
    </div>
    <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
    <nav {...elementProps?.pagination} className={classNames('property-listings-pagination', styles.pagination, elementProps?.pagination?.className)} aria-label={t(lang, 'pagination')} hidden={props.loadingMode === 'infinite' || (!busy && listings.length === 0)}>
      <button {...elementProps?.pageButton} className={classNames('property-listings-page-button', styles.pageButton, elementProps?.pageButton?.className)} type="button" hidden={props.loadingMode !== 'load-more' || noMorePages} disabled={busy || loadingMore || !hasNext} onClick={() => void loadPage(page + 1, false)}>{loadingMore ? t(lang, 'loadingMore') : props.loadMoreLabel}</button>
      <button {...elementProps?.pageButton} className={classNames('property-listings-page-button', styles.pageButton, elementProps?.pageButton?.className)} type="button" hidden={props.loadingMode !== 'pagination'} disabled={busy || loadingMore || page === 0} onClick={() => void loadPage(page - 1, true)}>{props.previousLabel}</button>
      <div className={styles.pageNumbers} hidden={props.loadingMode !== 'pagination'} aria-label={t(lang, 'pageOf', { current: page + 1, total: totalPages })}>
        {pageNumbers.map((number) => <button key={number} {...elementProps?.pageButton} className={classNames('property-listings-page-button', styles.pageButton, number === page && 'property-listings-page-button--current', elementProps?.pageButton?.className)} type="button" disabled={busy || loadingMore} aria-current={number === page ? 'page' : undefined} onClick={() => void loadPage(number, true)}>{number + 1}</button>)}
      </div>
      <button {...elementProps?.pageButton} className={classNames('property-listings-page-button', styles.pageButton, elementProps?.pageButton?.className)} type="button" hidden={props.loadingMode !== 'pagination' || noMorePages} disabled={busy || loadingMore || !hasNext} onClick={() => void loadPage(page + 1, true)}>{props.nextLabel}</button>
    </nav>
    <ComparisonSpace />
  </Root></ComparisonScope>;
};

export default PropertyListings;
