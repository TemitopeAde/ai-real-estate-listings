import { location } from "@wix/site-location";

/**
 * Stale-while-revalidate cache for the public listings API, shared by the site
 * widgets and the Editor components.
 *
 * API responses are sent with `Cache-Control: no-store` because they depend on
 * the site's plan, and one backend serves many sites, so caching happens here:
 * in memory and in this tab's sessionStorage, scoped to the site.
 *
 * - fresh (age < freshMs): returned without calling the API
 * - stale (age < maxStaleMs): returned at once, refreshed in the background
 * - older or missing: fetched
 * Concurrent requests for a key share one call; errors are never cached.
 */

export interface CacheTiming {
  freshMs: number;
  maxStaleMs: number;
}

export interface CacheListener<T> {
  onValue?: (value: T) => void;
  onError?: (error: unknown) => void;
}

interface Entry {
  value: unknown;
  storedAt: number;
  json: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

export const LISTING_CACHE: CacheTiming = { freshMs: 2 * 60_000, maxStaleMs: 30 * 60_000 };
export const RELATED_CACHE: CacheTiming = { freshMs: 5 * 60_000, maxStaleMs: 30 * 60_000 };
export const PRICE_RANGE_CACHE: CacheTiming = { freshMs: 10 * 60_000, maxStaleMs: 60 * 60_000 };

const STORAGE_PREFIX = "estateai:cache:v1:";

export function createDataCache(options: {
  now?: () => number;
  storage?: () => StorageLike | undefined;
  /** Namespaces stored entries, e.g. by site. `null` keeps entries in memory only. */
  scope?: () => string | null;
} = {}) {
  const now = options.now ?? Date.now;
  const memory = new Map<string, Entry>();
  const inflight = new Map<string, Promise<unknown>>();
  const listeners = new Map<string, Set<CacheListener<unknown>>>();

  const storage = (): StorageLike | undefined => {
    try {
      return options.storage?.();
    } catch {
      return undefined;
    }
  };
  const currentScope = (): string | null => (options.scope ? options.scope() : "");
  // Memory and in-flight requests are scoped too, so two sites never share entries.
  const memoryKey = (key: string): string => `${currentScope() ?? "~memory"}|${key}`;
  const storageKey = (key: string): string | null => {
    const scope = currentScope();
    return scope === null ? null : `${STORAGE_PREFIX}${scope}:${key}`;
  };

  function read(key: string): Entry | undefined {
    const cached = memory.get(memoryKey(key));
    if (cached) return cached;
    const stored = storageKey(key);
    if (!stored) return undefined;
    try {
      const raw = storage()?.getItem(stored);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { value?: unknown; storedAt?: unknown };
      if (typeof parsed.storedAt !== "number" || !("value" in parsed)) return undefined;
      const entry = { value: parsed.value, storedAt: parsed.storedAt, json: JSON.stringify(parsed.value) };
      memory.set(memoryKey(key), entry);
      return entry;
    } catch {
      return undefined;
    }
  }

  function write(key: string, value: unknown): Entry {
    const entry = { value, storedAt: now(), json: JSON.stringify(value) };
    memory.set(memoryKey(key), entry);
    const stored = storageKey(key);
    if (stored) {
      try {
        storage()?.setItem(stored, JSON.stringify({ value, storedAt: entry.storedAt }));
      } catch {
        // Quota exceeded or storage blocked: the memory copy still works.
      }
    }
    return entry;
  }

  function notify(key: string, event: { value: unknown } | { error: unknown }) {
    for (const listener of listeners.get(key) ?? []) {
      try {
        if ("value" in event) listener.onValue?.(event.value);
        else listener.onError?.(event.error);
      } catch (error) {
        console.error("Cache listener failed.", error);
      }
    }
  }

  function load<T>(key: string, loader: () => Promise<T>, background: boolean): Promise<T> {
    const flightKey = memoryKey(key);
    const pending = inflight.get(flightKey);
    if (pending) return pending as Promise<T>;
    const previous = memory.get(flightKey);
    const promise = loader()
      .then((value) => {
        const entry = write(key, value);
        // Background refreshes only wake subscribers when the data actually changed.
        if (!background || entry.json !== previous?.json) notify(key, { value });
        return value;
      })
      .catch((error: unknown) => {
        if (background) notify(key, { error });
        throw error;
      })
      .finally(() => inflight.delete(flightKey));
    inflight.set(flightKey, promise);
    return promise;
  }

  return {
    /** Cached value (fresh or stale) or a network load, following the rules above. */
    fetch<T>(key: string, loader: () => Promise<T>, timing: CacheTiming): Promise<T> {
      const entry = read(key);
      const age = entry ? now() - entry.storedAt : Number.POSITIVE_INFINITY;
      if (entry && age < timing.freshMs) return Promise.resolve(entry.value as T);
      if (entry && age < timing.maxStaleMs) {
        void load(key, loader, true).catch(() => { /* Reported to subscribers. */ });
        return Promise.resolve(entry.value as T);
      }
      return load(key, loader, false);
    },
    /** Synchronous read for a first render; undefined when missing or too old. */
    peek<T>(key: string, timing: CacheTiming): T | undefined {
      const entry = read(key);
      return entry && now() - entry.storedAt < timing.maxStaleMs ? (entry.value as T) : undefined;
    },
    /** Hears about background refreshes (changed values and errors). Returns an unsubscribe function. */
    subscribe<T>(key: string, listener: CacheListener<T>): () => void {
      const set = listeners.get(key) ?? new Set();
      set.add(listener as CacheListener<unknown>);
      listeners.set(key, set);
      return () => {
        set.delete(listener as CacheListener<unknown>);
        if (set.size === 0) listeners.delete(key);
      };
    },
    /** Drops every entry whose key starts with `prefix` ("" clears everything). */
    invalidate(prefix = ""): void {
      const scoped = memoryKey(prefix);
      for (const key of [...memory.keys()]) if (key.startsWith(scoped)) memory.delete(key);
      const store = storage();
      const stored = storageKey(prefix);
      if (!store || stored === null) return;
      try {
        const doomed: string[] = [];
        for (let index = 0; index < store.length; index += 1) {
          const key = store.key(index);
          if (key?.startsWith(stored)) doomed.push(key);
        }
        doomed.forEach((key) => store.removeItem(key));
      } catch {
        // Storage unavailable: memory is already cleared.
      }
    },
  };
}

// Site scope: sessionStorage is per origin, and free Wix sites share one origin,
// so stored entries are namespaced by the site's base URL. Until it is known
// (or where it can't be read, e.g. the Editor) entries stay in memory only.
let siteScope: string | null = null;
let siteScopePromise: Promise<void> | undefined;

export function ensureSiteScope(): Promise<void> {
  siteScopePromise ??= location
    .baseUrl()
    .then((baseUrl) => {
      siteScope = baseUrl ? baseUrl.replace(/\/+$/, "") : null;
    })
    .catch(() => {
      siteScope = null;
    });
  return siteScopePromise;
}

export const publicDataCache = createDataCache({
  storage: () => (typeof sessionStorage === "undefined" ? undefined : sessionStorage),
  scope: () => siteScope,
});

/** Site-scoped `publicDataCache.fetch`. */
export async function cachedFetch<T>(key: string, loader: () => Promise<T>, timing: CacheTiming): Promise<T> {
  await ensureSiteScope();
  return publicDataCache.fetch(key, loader, timing);
}
