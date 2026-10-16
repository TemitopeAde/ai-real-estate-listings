import { createContext, useContext } from 'react';
import type { A11y } from '@wix/editor-react-types';
import { convertA11yKeysToHtmlFormat, useCurrentUrl, useSiteUrl } from '@wix/react-component-utils';

export const DesignModeContext = createContext(false);
export function useDesignMode(): boolean { return useContext(DesignModeContext); }

// The Editor preview does not register @wix/site-service-url, so these hooks throw there.
// useService reads context before throwing, so hook order stays stable across renders.
export function useSafeSiteUrl(): string {
  try { return useSiteUrl(); } catch { return ''; }
}

export function useSafeCurrentUrl(): string {
  try { return useCurrentUrl(); } catch { return typeof window === 'undefined' ? '' : window.location.href; }
}

export function propertyUrl(siteUrl: string, destination: string, listingId?: string): string {
  const url = new URL(destination.replace(/^\//, ''), siteUrl ? `${siteUrl.replace(/\/+$/, '')}/` : 'https://relative.invalid/');
  if (listingId) url.searchParams.set('id', listingId);
  return siteUrl || /^https?:/.test(destination) ? url.href : `${url.pathname}${url.search}${url.hash}`;
}

export function accessibilityAttributes(a11y?: A11y) {
  if (!a11y) return {};
  const { tag, tabIndex, ...attributes } = a11y;
  return { ...convertA11yKeysToHtmlFormat(attributes), tabIndex };
}
