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

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency || 'USD'} ${price.toLocaleString()}`;
  }
}

export function formatDate(date?: Date): string {
  return date
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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
