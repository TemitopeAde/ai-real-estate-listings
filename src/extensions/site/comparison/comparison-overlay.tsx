import React, { useEffect, useRef, useState } from 'react';
import { Columns3, X } from 'lucide-react';
import type { ComparisonStore } from '../../../lib/property-comparison';
import { getImageUrls } from '../../../lib/site-widget';
import { t, widgetTextDirection } from '../../../lib/widget-i18n';
import { comparisonLabels } from './comparison-i18n';
import { useComparisonSnapshot, type ComparisonOptions } from './comparison-runtime';
import { comparisonRows, loadComparedProperties, type ComparedProperty } from './comparison-data';
import styles from './comparison.module.css';

type Props = { store: ComparisonStore; options: ComparisonOptions };
export function ComparisonOverlay({ store, options }: Props) {
  const state = useComparisonSnapshot(store);
  const labels = comparisonLabels(options.lang);
  const trayRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const tray = trayRef.current;
    if (!tray || !state.items.length) { store.reserve(0); return; }
    const measure = () => store.reserve(Math.ceil(tray.getBoundingClientRect().height) + 104);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tray);
    return () => observer.disconnect();
  }, [store, state.items.length]);
  if (!state.items.length) return null;
  return <div className={styles.surface} lang={options.lang} dir={widgetTextDirection(options.lang)}>
    <aside ref={trayRef} className={styles.tray} aria-label={labels.compare}>
      <div className={styles.traySummary}>
        <Columns3 size={20} aria-hidden="true" />
        <span className={styles.count} aria-live="polite">{state.items.length}/4 {labels.selected}</span>
      </div>
      <div className={styles.chips}>
        {state.items.map((item) => <button key={item.id} className={styles.chip} type="button" onClick={() => store.remove(item.id)} aria-label={`${labels.remove}: ${item.title}`}>
          {item.image ? <img src={item.image} className={styles.chipImage} alt="" /> : null}
          <span className={styles.chipTitle}>{item.title}</span><X size={14} aria-hidden="true" />
        </button>)}
      </div>
      <button type="button" className={styles.secondary} onClick={store.clear}>{labels.clear}</button>
      <button type="button" className={styles.primary} disabled={state.items.length < 2} onClick={store.open}>{labels.compare}</button>
      {state.limitReached || state.items.length < 2 ? <output className={styles.hint}>{state.limitReached ? labels.maximum : labels.minimum}</output> : null}
    </aside>
    {state.open ? <ComparisonDialog store={store} options={options} /> : null}
  </div>;
}

function ComparisonDialog({ store, options }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const state = useComparisonSnapshot(store);
  const labels = comparisonLabels(options.lang);
  const [properties, setProperties] = useState<Array<ComparedProperty>>([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [differencesOnly, setDifferencesOnly] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void loadComparedProperties(state.items, controller.signal).then((result) => {
      if (!controller.signal.aborted) { setProperties(result); setLoading(false); }
    });
    return () => controller.abort();
  }, [state.items, retry]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus();
    return () => { dialog.close(); document.documentElement.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const available = properties.filter((property) => property.listing !== null);
  const rows = comparisonRows(options.lang, options.locale).map((row) => {
    const values = state.items.map((item) => {
      const listing = properties.find((property) => property.item.id === item.id)?.listing;
      return listing ? row.value(listing) : '—';
    });
    const known = state.items.flatMap((item, index) => properties.some((property) => property.item.id === item.id && property.listing) ? [values[index]] : []);
    return { ...row, values, different: new Set(known).size > 1 };
  }).filter((row) => !differencesOnly || available.length < 2 || row.different);
  return <dialog ref={dialogRef} className={styles.dialog} aria-label={labels.compare} onCancel={(event) => { event.preventDefault(); store.close(); }}>
    <header className={styles.dialogHeader}>
      <div><p className={styles.eyebrow}>{labels.compare}</p><h2 className={styles.heading}>{labels.title}</h2></div>
      <button type="button" className={styles.iconButton} onClick={store.close} aria-label={labels.close} ref={closeRef}><X size={22} aria-hidden="true" /></button>
    </header>
    <div className={styles.dialogTools}>
      <label className={styles.differences}><input type="checkbox" checked={differencesOnly} disabled={loading || available.length < 2} onChange={(event) => setDifferencesOnly(event.target.checked)} />{labels.differences}</label>
      {properties.some((property) => property.failed) ? <button type="button" className={styles.secondary} disabled={loading} onClick={() => setRetry((value) => value + 1)}>{labels.retry}</button> : null}
      <output className={styles.loading}>{loading ? labels.loading : ''}</output>
    </div>
    <p className={styles.scrollHint}>{labels.scroll}</p>
    {/* Keyboard focus lets visitors scroll the comparison table without a pointer. */}
    <section className={styles.tableScroll} tabIndex={0} aria-label={labels.compare}>
      <table className={styles.table} aria-busy={loading}>
        <caption className={styles.visuallyHidden}>{labels.compare}</caption>
        <thead><tr><th className={styles.corner} scope="col"><Columns3 size={24} aria-hidden="true" /></th>
          {state.items.map((item) => {
            const property = properties.find((value) => value.item.id === item.id);
            const listing = property?.listing;
            const image = listing ? getImageUrls(listing)[0] : item.image;
            return <th key={item.id} className={styles.propertyHeader} scope="col">
              {image ? <img src={image} alt="" className={styles.propertyImage} /> : <div className={styles.imageFallback} />}
              <h3 className={styles.propertyTitle}>{listing?.title ?? item.title}</h3>
              {property?.failed && !loading ? <p className={styles.unavailable}>{labels.unavailable}</p> : null}
              <div className={styles.propertyActions}>
                <button type="button" className={styles.viewButton} disabled={!listing || loading} onClick={() => { store.close(); void options.onView(item.id); }}>{t(options.lang, 'viewProperty')}</button>
                <button type="button" className={styles.iconButton} onClick={() => store.remove(item.id)} aria-label={`${labels.remove}: ${item.title}`}><X size={16} aria-hidden="true" /></button>
              </div>
            </th>;
          })}
        </tr></thead>
        <tbody>{rows.map((row) => <tr key={row.key} className={row.different ? styles.differentRow : undefined}>
          <th className={styles.rowLabel} scope="row">{row.label}</th>
          {row.values.map((value, index) => <td key={state.items[index]?.id ?? index} className={styles.value}>{loading ? '—' : value}</td>)}
        </tr>)}</tbody>
      </table>
    </section>
  </dialog>;
}
