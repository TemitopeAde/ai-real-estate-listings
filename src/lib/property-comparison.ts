export const COMPARISON_LIMIT = 4;
export type ComparisonItem = { id: string; title: string; image: string };
export type ComparisonSnapshot = { items: Array<ComparisonItem>; open: boolean; limitReached: boolean; space: number };
export interface ComparisonStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

export function readComparison(value: string | null): Array<ComparisonItem> {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const items: Array<ComparisonItem> = [];
    for (const value of parsed) {
      if (!value || typeof value !== 'object') continue;
      const record = value as Record<string, unknown>;
      if (typeof record.id !== 'string' || !record.id || record.id.length > 256 || items.some((item) => item.id === record.id)) continue;
      items.push({ id: record.id, title: typeof record.title === 'string' ? record.title.slice(0, 500) : '', image: typeof record.image === 'string' ? record.image : '' });
      if (items.length === COMPARISON_LIMIT) break;
    }
    return items;
  } catch { return []; }
}

export function createComparisonStore(key: string, storage?: ComparisonStorage) {
  let initial: Array<ComparisonItem> = [];
  try { initial = readComparison(storage?.getItem(key) ?? null); } catch { /* Storage can be unavailable in private browsing. */ }
  let snapshot: ComparisonSnapshot = { items: initial, open: false, limitReached: false, space: 0 };
  const listeners = new Set<() => void>();
  const update = (next: ComparisonSnapshot) => {
    snapshot = next;
    try { storage?.setItem(key, JSON.stringify(next.items)); } catch { /* The in-memory selection remains usable. */ }
    listeners.forEach((listener) => listener());
  };
  const remove = (id: string) => {
    const items = snapshot.items.filter((item) => item.id !== id);
    update({ ...snapshot, items, open: snapshot.open && items.length >= 2, limitReached: false });
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    toggle(item: ComparisonItem) {
      if (snapshot.items.some((value) => value.id === item.id)) { remove(item.id); return; }
      if (snapshot.items.length >= COMPARISON_LIMIT) { update({ ...snapshot, limitReached: true }); return; }
      update({ ...snapshot, items: [...snapshot.items, item], limitReached: false });
    },
    remove,
    reserve(space: number) { if (snapshot.space !== space) update({ ...snapshot, space }); },
    clear: () => update({ items: [], open: false, limitReached: false, space: 0 }),
    open: () => { if (snapshot.items.length >= 2) update({ ...snapshot, open: true, limitReached: false }); },
    close: () => update({ ...snapshot, open: false }),
  };
}
export type ComparisonStore = ReturnType<typeof createComparisonStore>;
