import { httpClient } from '@wix/essentials';
import type { Listing } from '../../../lib/listing-types';
import type { ComparisonItem } from '../../../lib/property-comparison';
import { formatListingPrice, getListingLocation } from '../../../lib/site-widget';
import { t, type WidgetLangCode } from '../../../lib/widget-i18n';
import { comparisonLabels } from './comparison-i18n';

export type ComparedProperty = { item: ComparisonItem; listing: Listing | null; failed: boolean };
export async function loadComparedProperties(items: Array<ComparisonItem>, signal: AbortSignal): Promise<Array<ComparedProperty>> {
  return Promise.all(items.map(async (item) => {
    try {
      const response = await httpClient.fetchWithAuth(`${new URL(import.meta.url).origin}/api/public-listings/listing?id=${encodeURIComponent(item.id)}`, { signal, headers: { Accept: 'application/json' } });
      if (!response.ok) return { item, listing: null, failed: true };
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('_id' in data) || data._id !== item.id || !('title' in data) || typeof data.title !== 'string') throw new Error('Invalid property response.');
      return { item, listing: data as Listing, failed: false };
    } catch (error) {
      if (!signal.aborted) console.error('Unable to load property for comparison.', error);
      return { item, listing: null, failed: true };
    }
  }));
}

export function comparisonRows(lang: WidgetLangCode, locale: string) {
  const labels = comparisonLabels(lang);
  const number = (value: number | undefined) => value === undefined ? labels.missing : value.toLocaleString(locale);
  return [
    { key: 'price', label: t(lang, 'price'), value: (p: Listing) => formatListingPrice(p, locale) },
    { key: 'transaction', label: t(lang, 'transactionType'), value: (p: Listing) => t(lang, `transaction.${p.transactionType}`) },
    { key: 'type', label: t(lang, 'propertyType'), value: (p: Listing) => t(lang, `type.${p.propertyType}`) },
    { key: 'location', label: t(lang, 'location'), value: (p: Listing) => getListingLocation(p, labels.missing) },
    { key: 'bedrooms', label: labels.bedrooms, value: (p: Listing) => number(p.bedrooms) },
    { key: 'bathrooms', label: labels.bathrooms, value: (p: Listing) => number(p.bathrooms) },
    { key: 'area', label: labels.area, value: (p: Listing) => `${p.area.toLocaleString(locale)} ${p.areaUnit}` },
    { key: 'amenities', label: t(lang, 'amenities'), value: (p: Listing) => p.amenities?.length ? [...new Set(p.amenities)].sort().join(', ') : labels.missing },
    { key: 'year', label: labels.year, value: (p: Listing) => p.yearBuilt === undefined ? labels.missing : String(p.yearBuilt) },
    { key: 'parking', label: labels.parking, value: (p: Listing) => number(p.parkingSpaces) },
  ];
}
