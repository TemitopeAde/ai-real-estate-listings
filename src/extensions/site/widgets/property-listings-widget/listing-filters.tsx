import { type FC, type PointerEvent, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { PROPERTY_TYPES, TRANSACTION_TYPES, type ListingPriceRange } from "../../../../lib/listing-types";
import type { ListingWidgetConfig } from "../../../../lib/site-widget";
import styles from "./property-listings-widget.module.css";

export interface ListingFilters {
  search: string;
  transactionType: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
}

export const EMPTY_LISTING_FILTERS: ListingFilters = {
  search: "",
  transactionType: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
};

function formatFilterPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export const FALLBACK_PRICE_RANGE: ListingPriceRange = {
  minPrice: 0,
  maxPrice: 1_000_000,
  currency: "USD",
};

export function usablePriceRange(range: ListingPriceRange | null, listings: Array<{ price: number; currency: string }>): ListingPriceRange {
  const listed = listings.reduce<ListingPriceRange | null>((current, listing) => {
    if (!Number.isFinite(listing.price) || listing.price < 0) return current;
    if (!current) return { minPrice: listing.price, maxPrice: listing.price, currency: listing.currency || "USD" };
    return {
      minPrice: Math.min(current.minPrice, listing.price),
      maxPrice: Math.max(current.maxPrice, listing.price),
      currency: listing.currency || current.currency,
    };
  }, null);
  const minPrice = 0;
  const maxPrice = range?.maxPrice ?? listed?.maxPrice ?? FALLBACK_PRICE_RANGE.maxPrice;
  const currency = range?.currency ?? listed?.currency ?? FALLBACK_PRICE_RANGE.currency;
  if (maxPrice > minPrice) return { minPrice, maxPrice, currency };
  return { minPrice: 0, maxPrice: Math.max(maxPrice * 2, FALLBACK_PRICE_RANGE.maxPrice), currency };
}

function priceStep(min: number, max: number): number {
  const span = Math.max(1, max - min);
  const raw = span / 100;
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(raw)));
  return Math.max(1, Math.round(raw / magnitude) * magnitude);
}

function sliderPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

const PriceSlider: FC<{
  filters: ListingFilters;
  range: ListingPriceRange;
  onChange: (key: keyof ListingFilters, value: string) => void;
}> = ({ filters, range, onChange }) => {
  const minValue = filters.minPrice ? Number(filters.minPrice) : range.minPrice;
  const maxValue = filters.maxPrice ? Number(filters.maxPrice) : range.maxPrice;
  const step = priceStep(range.minPrice, range.maxPrice);
  const toFilterValue = (value: number, bound: number) => value === bound ? "" : String(value);
  const left = sliderPercent(minValue, range.minPrice, range.maxPrice);
  const right = sliderPercent(maxValue, range.minPrice, range.maxPrice);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"min" | "max" | null>(null);

  const snap = (raw: number) => {
    const snapped = Math.round(raw / step) * step;
    return Math.min(range.maxPrice, Math.max(range.minPrice, snapped));
  };

  const valueAt = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return minValue;
    const rect = track.getBoundingClientRect();
    const ratio = rect.width <= 0 ? 0 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(range.minPrice + ratio * (range.maxPrice - range.minPrice));
  };

  const apply = (thumb: "min" | "max", next: number) => {
    if (thumb === "min") onChange("minPrice", toFilterValue(Math.min(next, maxValue), range.minPrice));
    else onChange("maxPrice", toFilterValue(Math.max(next, minValue), range.maxPrice));
  };

  const thumbForPointer = (clientX: number): "min" | "max" => {
    const track = trackRef.current;
    if (!track) return "min";
    const rect = track.getBoundingClientRect();
    const minX = rect.left + (left / 100) * rect.width;
    const maxX = rect.left + (right / 100) * rect.width;
    return Math.abs(clientX - minX) <= Math.abs(clientX - maxX) ? "min" : "max";
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const fromThumb = (event.target as HTMLElement).closest("[data-thumb]");
    const thumb = fromThumb?.getAttribute("data-thumb") === "max"
      ? "max"
      : fromThumb?.getAttribute("data-thumb") === "min"
        ? "min"
        : thumbForPointer(event.clientX);
    dragRef.current = thumb;
    event.currentTarget.setPointerCapture(event.pointerId);
    apply(thumb, valueAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    apply(dragRef.current, valueAt(event.clientX));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className={styles.priceFilter}>
      <div className={styles.priceFilterLabels}>
        <span>Price</span>
        <span>{formatFilterPrice(minValue, range.currency)} – {formatFilterPrice(maxValue, range.currency)}</span>
      </div>
      <div
        className={styles.priceSlider}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={trackRef} className={styles.priceSliderInner}>
          <div className={styles.priceSliderTrack} aria-hidden="true" />
          <div className={styles.priceSliderRange} style={{ left: `${left}%`, right: `${100 - right}%` }} aria-hidden="true" />
          <span className={styles.priceSliderThumb} data-thumb="min" style={{ left: `${left}%` }} />
          <span className={styles.priceSliderThumb} data-thumb="max" style={{ left: `${right}%` }} />
        </div>
        <label>
          <span className={styles.visuallyHidden}>Minimum price</span>
          <input
            type="range"
            min={range.minPrice}
            max={range.maxPrice}
            step={step}
            value={minValue}
            aria-valuemin={range.minPrice}
            aria-valuemax={range.maxPrice}
            aria-valuenow={minValue}
            onChange={(event) => {
              const next = Math.min(Number(event.target.value), maxValue);
              onChange("minPrice", toFilterValue(next, range.minPrice));
            }}
          />
        </label>
        <label>
          <span className={styles.visuallyHidden}>Maximum price</span>
          <input
            type="range"
            min={range.minPrice}
            max={range.maxPrice}
            step={step}
            value={maxValue}
            aria-valuemin={range.minPrice}
            aria-valuemax={range.maxPrice}
            aria-valuenow={maxValue}
            onChange={(event) => {
              const next = Math.max(Number(event.target.value), minValue);
              onChange("maxPrice", toFilterValue(next, range.maxPrice));
            }}
          />
        </label>
      </div>
    </div>
  );
};

export const ListingFiltersBar: FC<{
  filters: ListingFilters;
  config: ListingWidgetConfig;
  priceRange: ListingPriceRange | null;
  onChange: (key: keyof ListingFilters, value: string) => void;
  onReset: () => void;
}> = ({ filters, config, priceRange, onChange, onReset }) => {
  const hasFilters = Object.values(filters).some(Boolean);
  const sliderRange = priceRange ?? FALLBACK_PRICE_RANGE;

  return (
    <div className={styles.filters} style={{ background: config.filterBackgroundColor, color: config.filterTextColor }} role="search" aria-label="Filter properties">
      {config.showSearch ? (
        <label className={styles.searchField}>
          <Search aria-hidden="true" />
          <span className={styles.visuallyHidden}>Search properties</span>
          <input value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Search properties" />
        </label>
      ) : null}
      {config.showTransactionFilter ? (
        <label>
          <span className={styles.visuallyHidden}>Transaction type</span>
          <select value={filters.transactionType} onChange={(event) => onChange("transactionType", event.target.value)}>
            <option value="">Any listing type</option>
            {TRANSACTION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ) : null}
      {config.showPropertyTypeFilter ? (
        <label>
          <span className={styles.visuallyHidden}>Property type</span>
          <select value={filters.propertyType} onChange={(event) => onChange("propertyType", event.target.value)}>
            <option value="">Any property type</option>
            {PROPERTY_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ) : null}
      {config.showBedroomsFilter ? (
        <label>
          <span className={styles.visuallyHidden}>Minimum bedrooms</span>
          <select value={filters.bedrooms} onChange={(event) => onChange("bedrooms", event.target.value)}>
            <option value="">Any bedrooms</option>
            {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+ bedrooms</option>)}
          </select>
        </label>
      ) : null}
      {config.showPriceFilter ? <PriceSlider filters={filters} range={sliderRange} onChange={onChange} /> : null}
      {hasFilters ? <button className={styles.resetFilters} type="button" onClick={onReset}><X aria-hidden="true" /> Clear</button> : <SlidersHorizontal className={styles.filterIcon} aria-hidden="true" />}
    </div>
  );
};
