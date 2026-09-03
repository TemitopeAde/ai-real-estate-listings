import {
  LISTING_STATUSES,
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  type Listing,
} from './listings';

export function formatStatus(status: Listing['status']): string {
  return LISTING_STATUSES.find((option) => option.value === status)?.label ?? status;
}

export function formatPropertyType(propertyType: Listing['propertyType']): string {
  return PROPERTY_TYPES.find((option) => option.value === propertyType)?.label ?? propertyType;
}

export function formatTransactionType(transactionType: Listing['transactionType']): string {
  return (
    TRANSACTION_TYPES.find((option) => option.value === transactionType)?.label ??
    transactionType
  );
}

export function formatPrice(
  price: number,
  currency: string,
  locale?: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency || 'USD'} ${price.toLocaleString(locale)}`;
  }
}

type DateLike = Date | string | number | { $date?: string } | null | undefined;

function toDate(value: DateLike): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value === 'object' && value !== null && typeof value.$date === 'string') {
    const parsed = new Date(value.$date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

export function formatDate(date?: DateLike, locale?: string): string {
  const parsed = toDate(date);
  return parsed
    ? parsed.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
}

export function formatDateTime(date?: DateLike, locale?: string): string {
  const parsed = toDate(date);
  return parsed
    ? parsed.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
}

export function getImageUrl(image: unknown): string | undefined {
  if (typeof image === 'string' && image.trim()) {
    return image;
  }

  if (typeof image === 'object' && image !== null && 'url' in image) {
    const url = image.url;
    return typeof url === 'string' && url.trim() ? url : undefined;
  }

  return undefined;
}
