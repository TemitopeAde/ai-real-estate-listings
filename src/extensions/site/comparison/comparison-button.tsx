import React, { type FC } from 'react';
import classNames from 'classnames';
import type { Listing } from '../../../lib/listing-types';
import { getImageUrls } from '../../../lib/site-widget';
import type { WidgetLangCode } from '../../../lib/widget-i18n';
import { useComparisonSnapshot, useComparisonStore } from './comparison-runtime';
import { comparisonLabels } from './comparison-i18n';
import styles from './comparison.module.css';

type Props = { listing: Listing | null; lang: WidgetLangCode; className?: string | undefined; disabled?: boolean; hidden?: boolean };
export const ComparisonButton: FC<Props> = (props) => {
  const { listing, lang, className, disabled = false, hidden = false } = props;
  const store = useComparisonStore();
  const state = useComparisonSnapshot(store);
  const selected = Boolean(listing && state.items.some((item) => item.id === listing._id));
  const labels = comparisonLabels(lang);
  const unavailable = disabled || !listing || !store;
  // Keep clicks and keys from reaching card-level link handlers.
  return <label hidden={hidden} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}
    className={classNames('property-compare-button', styles.compareButton, selected && 'property-compare-button--selected', unavailable && 'property-compare-button--disabled', className)}>
    <input type="checkbox" className={styles.compareCheckbox} checked={selected} disabled={unavailable}
      aria-label={`${labels.checkbox}${listing ? `: ${listing.title}` : ''}`}
      onChange={() => {
        if (listing && !disabled) store?.toggle({ id: listing._id, title: listing.title, image: getImageUrls(listing)[0] ?? '' });
      }} />
    <span>{labels.checkbox}</span>
  </label>;
};

export function ComparisonSpace() {
  const state = useComparisonSnapshot(useComparisonStore());
  return <div aria-hidden="true" hidden={!state.space} style={{ blockSize: `${state.space}px` }} />;
}
