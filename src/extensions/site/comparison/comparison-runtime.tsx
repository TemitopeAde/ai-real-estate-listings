import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { location } from '@wix/site-location';
import { createComparisonStore, type ComparisonSnapshot, type ComparisonStore } from '../../../lib/property-comparison';
import type { WidgetLangCode } from '../../../lib/widget-i18n';
import { ComparisonOverlay } from './comparison-overlay';

export type ComparisonOptions = { lang: WidgetLangCode; locale: string; onView: (id: string) => void | Promise<void> };
type Runtime = { store: ComparisonStore; clients: Map<symbol, () => ComparisonOptions>; render: () => void };
declare global { interface Window { __realEstateComparisonRuntimes?: Map<string, Runtime>; } }
const EMPTY: ComparisonSnapshot = { items: [], open: false, limitReached: false, space: 0 };
const ComparisonContext = createContext<ComparisonStore | null>(null);

// The window registry shares one tray even when Wix builds widgets into separate bundles.
function getRuntime(siteUrl: string): Runtime {
  const site = siteUrl.replace(/\/+$/, '');
  const runtimes = window.__realEstateComparisonRuntimes ??= new Map();
  const existing = runtimes.get(site);
  if (existing) return existing;
  let storage: Storage | undefined;
  try { storage = window.sessionStorage; } catch { /* Fall back to this page's in-memory selection. */ }
  const store = createComparisonStore(`ai-real-estate-listings:comparison:v1:${site}`, storage);
  const clients = new Map<symbol, () => ComparisonOptions>();
  let root: Root | null = null;
  let host: HTMLDivElement | null = null;
  const runtime: Runtime = { store, clients, render() {
    const client = clients.values().next().value;
    if (!client) {
      // Defer root disposal until the parent React tree has completed its cleanup.
      queueMicrotask(() => {
        if (clients.size) return;
        root?.unmount(); root = null;
        host?.remove(); host = null;
      });
      return;
    }
    if (!host) {
      host = document.createElement('div');
      host.dataset.propertyComparisonHost = site;
      document.body.append(host);
      root = createRoot(host);
    }
    root?.render(<ComparisonOverlay store={store} options={client()} />);
  } };
  runtimes.set(site, runtime);
  return runtime;
}

export function useComparisonSnapshot(store: ComparisonStore | null): ComparisonSnapshot {
  const [snapshot, setSnapshot] = useState(EMPTY);
  useEffect(() => {
    if (!store) { setSnapshot(EMPTY); return; }
    const sync = () => setSnapshot(store.getSnapshot());
    sync();
    return store.subscribe(sync);
  }, [store]);
  return snapshot;
}
export const useComparisonStore = () => useContext(ComparisonContext);

export function ComparisonScope({ enabled, siteUrl, lang, locale, onView, children }: ComparisonOptions & { enabled: boolean; siteUrl?: string; children: ReactNode }) {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const latest = useRef<ComparisonOptions>({ lang, locale, onView });
  useEffect(() => { latest.current = { lang, locale, onView }; runtime?.render(); }, [lang, locale, onView, runtime]);
  useEffect(() => {
    if (!enabled) { setRuntime(null); return; }
    let active = true;
    let unregister = () => {};
    void (siteUrl ? Promise.resolve(siteUrl) : location.baseUrl()).then((url) => {
      if (!active) return;
      const next = getRuntime(url);
      const token = Symbol();
      next.clients.set(token, () => latest.current);
      setRuntime(next);
      next.render();
      unregister = () => { next.clients.delete(token); next.render(); };
    }).catch((error: unknown) => console.error('Unable to initialize property comparison.', error));
    return () => { active = false; unregister(); };
  }, [enabled, siteUrl]);
  return <ComparisonContext.Provider value={enabled ? runtime?.store ?? null : null}>{children}</ComparisonContext.Provider>;
}
