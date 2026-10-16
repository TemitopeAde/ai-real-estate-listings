import { useEffect, useRef, useState } from 'react';
import { httpClient } from '@wix/essentials';
import { authentication, currentMember } from '@wix/site-members';
import { location } from '@wix/site-location';
import type { Listing } from '../../../../lib/listing-types';
import type { DetailWidgetConfig } from '../../../../lib/site-widget';
import { LOCKED_PUBLIC_ACCESS, type PublicListingAccess } from '../../../../lib/public-listing-access';
import { showSiteToast } from '../../../../lib/site-toast';
import { ACCESS_RETRY_MS, AccessUnverifiedError, assertSubscriptionAccess, SubscriptionLockedError } from '../../../../lib/subscription-response';
import { t, useResolvedWidgetLanguage, useResolvedWidgetLocale, widgetTextDirection } from '../../../../lib/widget-i18n';

const apiOrigin = new URL(import.meta.url).origin;

function listingAccess(value: unknown): PublicListingAccess {
  if (!value || typeof value !== "object") return LOCKED_PUBLIC_ACCESS;
  const source = value as Record<string, unknown>;
  return {
    virtualTour: source.virtualTour === true,
    multiSceneTour: source.multiSceneTour === true,
    socialShare: source.socialShare === true,
    mortgageCalculator: source.mortgageCalculator === true,
    assistant: source.assistant === true,
    relatedListings: source.relatedListings === true,
  };
}

async function loadListing(id: string): Promise<{ listing: Listing; access: PublicListingAccess }> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?id=${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  assertSubscriptionAccess(response);
  if (!response.ok) throw new Error(response.status === 404 ? "not-found" : "load-failed");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") throw new Error("load-failed");
  const record = data as Listing & { access?: unknown };
  const { access: rawAccess, ...listing } = record;
  return { listing, access: listingAccess(rawAccess) };
}

export async function loadPublicListings(listing?: Listing, limit = 100): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (listing) {
    params.set("propertyType", listing.propertyType);
    params.set("transactionType", listing.transactionType);
  }
  params.set("pageSize", String(Math.min(100, Math.max(1, limit + 4))));
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data: unknown = await response.json();
  const items =
    data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
      ? ((data as { items: Listing[] }).items)
      : [];
  const city = listing ? (listing.address?.city || listing.city).trim().toLowerCase() : "";
  const candidates = items.filter((item) => !listing || item._id !== listing._id).filter((item) => item.status === "active");
  if (!listing) return candidates.slice(0, limit);
  const sameCity = candidates.filter((item) => (item.address?.city || item.city).trim().toLowerCase() === city);
  return [...sameCity, ...candidates.filter((item) => !sameCity.some((cityItem) => cityItem._id === item._id))].slice(0, limit);
}

async function recordView(id: string): Promise<number | undefined> {
  const payload: Record<string, string> = {};
  try {
    const member = await currentMember.getMember();
    if (member?._id) payload.viewerId = member._id;
    if (member?.profile?.nickname) payload.viewerName = member.profile.nickname;
    if (member?.loginEmail) payload.viewerEmail = member.loginEmail;
  } catch (error) {
    console.info("No logged-in member available for listing view.", error);
  }
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/listing?id=${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) return undefined;
  const data: unknown = await response.json();
  return typeof data === "object" && data !== null && "viewCount" in data && typeof data.viewCount === "number" ? data.viewCount : undefined;
}

// Guests have no saved list; skip the request instead of letting the API answer 401.
async function isMemberLoggedIn(): Promise<boolean> {
  try { return Boolean((await currentMember.getMember())?._id); } catch { return false; }
}

async function savedAction(action: "list" | "save" | "remove", listingId: string): Promise<unknown> {
  const response = await httpClient.fetchWithAuth(`${apiOrigin}/api/public-listings/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, listingId }) });
  if (!response.ok) throw new Error(response.status === 401 ? "login-required" : "saved-failed");
  return response.json();
}

export function usePropertyDetail(config: DetailWidgetConfig, currentUrl?: string, designMode = false, enabled = true) {
  const lang = useResolvedWidgetLanguage(config.language);
  const locale = useResolvedWidgetLocale(lang);
  const dir = widgetTextDirection(lang);
  const dismissToast = t(lang, "dismissNotification");
  const [listing, setListing] = useState<Listing | null>(null);
  const [access, setAccess] = useState<PublicListingAccess>(LOCKED_PUBLIC_ACCESS);
  const [viewCount, setViewCount] = useState<number | undefined>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [featuredSavedIds, setFeaturedSavedIds] = useState<Set<string>>(new Set());
  const savingFeaturedIds = useRef(new Set<string>());
  // "locked": the site has no active plan (the listing API answered 403).
  const [state, setState] = useState<"loading" | "locked" | "missing" | "not-found" | "error" | "ready">("loading");
  const [retryToken, setRetryToken] = useState(0);
  useEffect(() => {
    if (!enabled) { setListing(null); return; }
    let mounted = true;
    let retryTimer: number | undefined;
    setState("loading");
    setListing(null);
    setSaved(false);
    const queryPromise = currentUrl === undefined ? location.query() : Promise.resolve().then(() => Object.fromEntries(new URL(currentUrl).searchParams));
    void queryPromise.then((query) => {
      const queryRecord = typeof query === "object" && query !== null ? query as Record<string, unknown> : {};
      const id = queryRecord.id;
      if (typeof id !== "string" || !id) { if (mounted) setState("missing"); return; }
      return loadListing(id).then(async (data) => { if (!mounted) return; setListing(data.listing); setAccess(data.access); setViewCount(data.listing.viewCount); setState("ready"); try { if (!(await isMemberLoggedIn())) throw new Error("login-required"); const savedResponse = await savedAction("list", id); const value = typeof savedResponse === "object" && savedResponse !== null ? savedResponse as { items?: Array<{ id?: string }> } : {}; if (mounted) { const ids = new Set((value.items ?? []).flatMap((item) => item.id ? [item.id] : [])); setSaved(ids.has(id)); setFeaturedSavedIds(ids); } } catch { /* Guests start unsaved. */ } return designMode || !mounted ? undefined : recordView(id); }).then((count) => { if (mounted && typeof count === "number") setViewCount(count); }).catch((reason: unknown) => {
        if (!mounted) return;
        if (reason instanceof SubscriptionLockedError) { setState("locked"); return; }
        // Billing couldn't be verified: stay in the loading state and retry quietly.
        if (reason instanceof AccessUnverifiedError) { retryTimer = window.setTimeout(() => setRetryToken((value) => value + 1), ACCESS_RETRY_MS); return; }
        setState(reason instanceof Error && reason.message === "not-found" ? "not-found" : "error");
      });
    }).catch((reason: unknown) => { console.error("Unable to read property URL.", reason); if (mounted) setState("error"); });
    return () => { mounted = false; window.clearTimeout(retryTimer); };
  }, [currentUrl, designMode, enabled, retryToken]);
  useEffect(() => {
    if (!enabled || !listing || !config.showFeaturedListings || !access.relatedListings) { setFeaturedListings([]); return; }
    let mounted = true;
    void loadPublicListings(listing, Math.min(8, Math.max(1, Math.round(config.featuredCount)))).then((items) => { if (mounted) setFeaturedListings(items); }).catch((error: unknown) => console.error("Unable to load related properties.", error));
    return () => { mounted = false; };
  }, [listing, config.showFeaturedListings, config.featuredCount, access.relatedListings, enabled]);
  const handleSave = async () => {
    if (!enabled || !listing || designMode || saving) return;
    const previous = saved;
    const next = !saved;
    setSaved(next);
    setSaving(true);
    try {
      try { await savedAction(previous ? "remove" : "save", listing._id); } catch (error) {
        if (!(error instanceof Error) || error.message !== "login-required") throw error;
        await authentication.promptLogin();
        await savedAction("save", listing._id);
        setSaved(true);
      }
      window.dispatchEvent(new CustomEvent("saved-properties:changed", { detail: { listingId: listing._id, saved: next } }));
      showSiteToast(next ? t(lang, "propertySaved") : t(lang, "propertyRemoved"), next ? t(lang, "savedFind") : t(lang, "removedFromList"), "success", dismissToast);
    } catch (error) {
      setSaved(previous);
      console.error("Unable to update saved property.", error);
      showSiteToast(error instanceof Error && error.message === "login-required" ? t(lang, "signInToSave") : t(lang, "couldNotUpdateSaved"), t(lang, "tryAgain"), "error", dismissToast);
    } finally { setSaving(false); }
  };
  const handleFeaturedSave = async (id: string) => {
    if (!enabled || designMode || savingFeaturedIds.current.has(id)) return;
    savingFeaturedIds.current.add(id);
    const wasSaved = featuredSavedIds.has(id);
    const setMembership = (include: boolean) => setFeaturedSavedIds((current) => {
      const next = new Set(current);
      if (include) next.add(id); else next.delete(id);
      return next;
    });
    setMembership(!wasSaved);
    try {
      try { await savedAction(wasSaved ? 'remove' : 'save', id); }
      catch (error) {
        if (!(error instanceof Error) || error.message !== 'login-required') throw error;
        await authentication.promptLogin();
        await savedAction(wasSaved ? 'remove' : 'save', id);
      }
      window.dispatchEvent(new CustomEvent('saved-properties:changed', { detail: { listingId: id, saved: !wasSaved } }));
    } catch (error) {
      setMembership(wasSaved);
      console.error('Unable to update related saved property.', error);
      showSiteToast(t(lang, 'couldNotUpdateSaved'), t(lang, 'tryAgain'), 'error', dismissToast);
    } finally {
      savingFeaturedIds.current.delete(id);
    }
  };
  return { lang, locale, dir, listing, access, viewCount, saved, saving, quoteOpen, setQuoteOpen, featuredListings, featuredSavedIds, state, handleSave, handleFeaturedSave };
}

