import type { MouseEvent } from "react";
import { location } from "@wix/site-location";

/**
 * Site page navigation through Wix Location (`@wix/site-location`).
 *
 * Wix Location has no "back" method (`navigateBack()` exists only for
 * dashboard pages), so every navigation made through `navigateTo` records the
 * page it leaves on a small per-tab stack. `navigateBack` returns to the most
 * recent recorded page, or to a fallback page when there is none (direct
 * link, new tab, arrival from a search engine).
 */

/** Where Back goes when there is no previous page on this site. */
export const PROPERTIES_PAGE_PATH = "/properties";

const HISTORY_KEY = "estateai:page-history";
const MAX_HISTORY = 20;

function readHistory(): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeHistory(history: string[]): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); Back then uses its fallback.
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Converts a URL on this site to the "/page?query" form Wix Location expects; other URLs are returned unchanged. */
export function toSitePath(url: string, baseUrl: string): string {
  const base = withoutTrailingSlash(baseUrl);
  if (base && (url === base || url.startsWith(`${base}/`) || url.startsWith(`${base}?`) || url.startsWith(`${base}#`))) {
    const rest = url.slice(base.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return url;
}

function isSameSite(url: string, baseUrl: string): boolean {
  return toSitePath(url, baseUrl) !== url || url.startsWith("/");
}

/** Navigates to a site page with Wix Location, remembering the current page for `navigateBack`. */
export async function navigateTo(url: string): Promise<void> {
  const [baseUrl, currentUrl] = await Promise.all([location.baseUrl(), location.url()]);
  if (currentUrl) {
    const history = readHistory();
    if (history[history.length - 1] !== currentUrl) writeHistory([...history, currentUrl]);
  }
  await location.to(toSitePath(url, baseUrl));
}

/** Returns to the previous page visited through `navigateTo`, or to `fallbackUrl` when there is none. */
export async function navigateBack(fallbackUrl: string): Promise<void> {
  const [baseUrl, currentUrl] = await Promise.all([location.baseUrl(), location.url()]);
  const history = readHistory();
  let previous: string | undefined;
  while (history.length > 0) {
    const candidate = history.pop()!;
    if (candidate !== currentUrl && isSameSite(candidate, baseUrl)) {
      previous = candidate;
      break;
    }
  }
  writeHistory(history);
  await location.to(toSitePath(previous ?? fallbackUrl, baseUrl));
}

/**
 * Click handler for real `<a href>` links to site pages: keeps the native link for
 * new-tab / modified clicks, and otherwise navigates with Wix Location.
 */
export function onSiteLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: () => Promise<void>,
): void {
  const anchor = event.currentTarget;
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
    (anchor.target && anchor.target !== "_self")
  ) {
    return;
  }
  event.preventDefault();
  void navigate().catch((error: unknown) => {
    console.error("Wix Location navigation failed; following the link instead.", error);
    window.location.assign(anchor.href);
  });
}
