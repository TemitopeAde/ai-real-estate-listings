import { useEffect, useMemo, useRef, useState } from 'react';
import { httpClient } from '@wix/essentials';
import { authentication, currentMember } from '@wix/site-members';
import type { Listing, ListingPage, ListingPriceRange } from '../../../../lib/listing-types';
import type { ListingWidgetConfig } from '../../../../lib/site-widget';
import { showSiteToast } from '../../../../lib/site-toast';
import { LISTING_CACHE, PRICE_RANGE_CACHE, cachedFetch, publicDataCache } from '../../../../lib/public-data-cache';
import { ACCESS_RETRY_MS, AccessUnverifiedError, assertSubscriptionAccess, SubscriptionLockedError } from '../../../../lib/subscription-response';
import { t, useResolvedWidgetLanguage, useResolvedWidgetLocale, widgetTextDirection } from '../../../../lib/widget-i18n';
import { useDebouncedValue } from '../use-debounced-value';
import { EMPTY_LISTING_FILTERS, usablePriceRange, type ListingFilters } from './listing-filters';

const FILTER_DEBOUNCE_MS = 400;
const apiOrigin = new URL(import.meta.url).origin;

function listingsQuery(filters: ListingFilters, page: number, pageSize: number): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.transactionType) params.set("transactionType", filters.transactionType);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}

const listingsKey = (query: string) => `listings:${query}`;

/** Cached per filter/page combination (see public-data-cache). */
function loadListings(filters: ListingFilters, page: number, pageSize: number): Promise<ListingPage> {
  const query = listingsQuery(filters, page, pageSize);
  return cachedFetch(listingsKey(query), () => fetchListings(query), LISTING_CACHE);
}

async function fetchListings(query: string): Promise<ListingPage> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?${query}`, { headers: { Accept: "application/json" } });
  assertSubscriptionAccess(response);
  if (!response.ok) throw new Error("Listings could not be loaded.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) throw new Error("Listings response was invalid.");
  const result = data as Partial<ListingPage>;
  return {
    items: result.items as Listing[],
    totalCount: typeof result.totalCount === "number" ? result.totalCount : 0,
    hasNext: result.hasNext === true,
  };
}

function loadPriceRange(): Promise<ListingPriceRange | null> {
  return cachedFetch("price-range", fetchPriceRange, PRICE_RANGE_CACHE);
}

async function fetchPriceRange(): Promise<ListingPriceRange | null> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?priceRange=1`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Price range could not be loaded.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") return null;
  const result = data as Partial<ListingPriceRange>;
  const minPrice = Number(result.minPrice);
  const maxPrice = Number(result.maxPrice);
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return null;
  return {
    minPrice,
    maxPrice,
    currency: typeof result.currency === "string" && result.currency ? result.currency : "USD",
  };
}

// Guests have no saved list; skip the request instead of letting the API answer 401.
async function isMemberLoggedIn(): Promise<boolean> {
  try { return Boolean((await currentMember.getMember())?._id); } catch { return false; }
}

async function savedAction(action: "list" | "save" | "remove", listingId?: string): Promise<unknown> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, listingId }) });
  if (!response.ok) throw new Error(response.status === 401 ? "login-required" : "saved-failed");
  return response.json();
}

export function usePropertyListings(config: ListingWidgetConfig, designMode = false, enabled = true) {
  const lang = useResolvedWidgetLanguage(config.language);
  const locale = useResolvedWidgetLocale(lang);
  const dir = widgetTextDirection(lang);
  const dismissToast = t(lang, "dismissNotification");
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The site has no active plan (the listings API answered 403); widgets show their skeleton.
  const [locked, setLocked] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ListingFilters>(EMPTY_LISTING_FILTERS);
  const [priceRange, setPriceRange] = useState<ListingPriceRange | null>(null);
  const sliderRange = useMemo(() => usablePriceRange(priceRange, listings), [listings, priceRange]);
  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);
  const activeFilters = useMemo(() => ({
    ...debouncedFilters,
    search: config.showSearch ? debouncedFilters.search : "",
    transactionType: config.showTransactionFilter ? debouncedFilters.transactionType : "",
    propertyType: config.showPropertyTypeFilter ? debouncedFilters.propertyType : "",
    minPrice: config.showPriceFilter ? debouncedFilters.minPrice : "",
    maxPrice: config.showPriceFilter ? debouncedFilters.maxPrice : "",
    bedrooms: config.showBedroomsFilter ? debouncedFilters.bedrooms : "",
  }), [config, debouncedFilters]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestVersion = useRef(0);
  const pageRef = useRef(0);
  pageRef.current = page;
  const savingIds = useRef(new Set<string>());
  useEffect(() => {
    if (!enabled || !config.showPriceFilter) return;
    void loadPriceRange().then(setPriceRange).catch((reason: unknown) => {
      console.error("Unable to load listing price range.", reason);
      setPriceRange(null);
    });
  }, [enabled, config.showPriceFilter]);
  useEffect(() => {
    if (!enabled) { ++requestVersion.current; setListings([]); return; }
    const version = ++requestVersion.current;
    let mounted = true;
    setLoading(true);
    setLoadingMore(false);
    setPage(0);
    setHasNext(false);
    setError(null);
    let retryTimer: number | undefined;
    // Apply background refreshes of the cached first page, unless the visitor has loaded more since.
    const unsubscribe = publicDataCache.subscribe<ListingPage>(listingsKey(listingsQuery(activeFilters, 0, config.pageSize)), {
      onValue: (data) => {
        if (!mounted || version !== requestVersion.current || pageRef.current !== 0) return;
        setListings(data.items);
        setTotalCount(data.totalCount);
        setHasNext(data.hasNext);
      },
      onError: (reason) => {
        if (mounted && version === requestVersion.current && reason instanceof SubscriptionLockedError) { setLocked(true); setListings([]); }
      },
    });
    void loadListings(activeFilters, 0, config.pageSize).then((data) => {
      if (!mounted || version !== requestVersion.current) return;
      setLocked(false);
      setListings(data.items);
      setTotalCount(data.totalCount);
      setHasNext(data.hasNext);
      setLoading(false);
    }).catch((reason: unknown) => {
      if (!mounted || version !== requestVersion.current) return;
      if (reason instanceof SubscriptionLockedError) { setLocked(true); setListings([]); setLoading(false); return; }
      // Billing couldn't be verified: stay in the loading state and retry quietly.
      if (reason instanceof AccessUnverifiedError) { retryTimer = window.setTimeout(() => setRetryToken((value) => value + 1), ACCESS_RETRY_MS); return; }
      console.error("Unable to load public listings.", reason);
      setError(t(lang, "propertiesUnavailable"));
      setLoading(false);
    });
    return () => { mounted = false; window.clearTimeout(retryTimer); unsubscribe(); };
  }, [activeFilters, config.pageSize, lang, enabled, retryToken]);
  const loadPage = async (targetPage: number, replace: boolean) => {
    if (!enabled || loadingMore || (!replace && !hasNext)) return;
    const version = replace ? ++requestVersion.current : requestVersion.current;
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const data = await loadListings(activeFilters, targetPage, config.pageSize);
      if (version !== requestVersion.current) return;
      setListings((current) => {
        if (replace) return data.items;
        const existing = new Set(current.map((listing) => listing._id));
        return [...current, ...data.items.filter((listing) => !existing.has(listing._id))];
      });
      setPage(targetPage);
      setTotalCount(data.totalCount);
      setHasNext(data.hasNext);
      setError(null);
    } catch (reason: unknown) {
      if (reason instanceof SubscriptionLockedError) { if (version === requestVersion.current) { setLocked(true); setListings([]); } return; }
      console.error("Unable to load another listings page.", reason);
      if (version === requestVersion.current) setError(t(lang, "moreUnavailable"));
    } finally {
      if (version === requestVersion.current) { setLoading(false); setLoadingMore(false); }
    }
  };
  useEffect(() => {
    if (!enabled || designMode || typeof IntersectionObserver === "undefined" || config.loadingMode !== "infinite" || loading || !hasNext || !sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) void loadPage(page + 1, false); }, { rootMargin: "320px 0px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [config.loadingMode, hasNext, loading, page, activeFilters, config.pageSize, loadingMore, enabled, designMode]);
  useEffect(() => {
    if (!enabled) { setSavedIds(new Set()); return; }
    let active = true;
    void isMemberLoggedIn().then((loggedIn) => loggedIn ? savedAction("list") : Promise.reject(new Error("login-required"))).then((result) => {
      const value = typeof result === "object" && result !== null ? result as { items?: Array<{ id?: string }> } : {};
      if (active) setSavedIds(new Set((value.items ?? []).flatMap((item) => item.id ? [item.id] : [])));
    }).catch(() => { /* Guests have no saved state until they authenticate. */ });
    return () => { active = false; };
  }, [enabled]);
  const onSave = async (listingId: string) => {
    if (!enabled || designMode || savingIds.current.has(listingId)) return;
    savingIds.current.add(listingId);
    const previousSaved = savedIds.has(listingId);
    const nextSaved = !previousSaved;
    setSavedIds((current) => {
      const next = new Set(current);
      if (nextSaved) next.add(listingId); else next.delete(listingId);
      return next;
    });
    try {
      if (nextSaved) {
        try { await savedAction("save", listingId); } catch (error) {
          if (!(error instanceof Error) || error.message !== "login-required") throw error;
          await authentication.promptLogin();
          await savedAction("save", listingId);
        }
      } else await savedAction("remove", listingId);
      window.dispatchEvent(new CustomEvent("saved-properties:changed", { detail: { listingId, saved: nextSaved } }));
      showSiteToast(nextSaved ? t(lang, "propertySaved") : t(lang, "propertyRemoved"), nextSaved ? t(lang, "savedFind") : t(lang, "removedFromList"), "success", dismissToast);
    } catch (error) {
      setSavedIds((current) => {
        const next = new Set(current);
        if (previousSaved) next.add(listingId); else next.delete(listingId);
        return next;
      });
      console.error("Unable to update saved property.", error);
      showSiteToast(error instanceof Error && error.message === "login-required" ? t(lang, "signInToSave") : t(lang, "couldNotUpdateSaved"), t(lang, "tryAgain"), "error", dismissToast);
    } finally {
      savingIds.current.delete(listingId);
    }
  };
  const updateFilter = (key: keyof ListingFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters(EMPTY_LISTING_FILTERS);
  return { lang, locale, dir, listings, totalCount, page, hasNext, loading, loadingMore, error, locked, savedIds, filters, sliderRange, activeFilters, sentinelRef, onSave, updateFilter, resetFilters, loadPage };
}

