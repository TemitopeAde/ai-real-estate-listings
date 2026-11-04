import { useEffect, useState, type FC } from 'react';
import classNames from 'classnames';
import { t, type WidgetLangCode } from '../../../../lib/widget-i18n';
import styles from './gallery.module.css';

const ChevronLeftIcon: FC = () => <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const ChevronRightIcon: FC = () => <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;

type Part = { className?: string };
export type GalleryParts = { image?: Part | undefined; control?: Part | undefined; dots?: Part | undefined };

type GalleryProps = {
  className?: string;
  selectorPrefix?: string;
  images: Array<string>;
  title: string;
  lang: WidgetLangCode;
  elementProps?: GalleryParts;
};

export const Gallery: FC<GalleryProps> = (props) => {
  const { className, selectorPrefix = 'property-gallery', images, title, lang, elementProps } = props;
  const [index, setIndex] = useState(0);
  const imagesKey = images.join('|');
  useEffect(() => setIndex(0), [imagesKey]);
  const current = images[index] ?? images[0];
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);
  return <div className={classNames(selectorPrefix, styles.root, className)}>
    <img {...elementProps?.image} className={classNames(`${selectorPrefix}-image`, styles.image, elementProps?.image?.className)} src={current} alt={current ? title : ''} hidden={!current} loading="lazy" />
    {!current ? <div className={styles.empty} aria-hidden="true" /> : null}
    <button {...elementProps?.control} className={classNames(`${selectorPrefix}-control`, styles.control, styles.previous, elementProps?.control?.className)} type="button" hidden={images.length < 2} disabled={images.length < 2} onClick={() => move(-1)} aria-label={t(lang, 'previousImage')}><ChevronLeftIcon /></button>
    <button {...elementProps?.control} className={classNames(`${selectorPrefix}-control`, styles.control, styles.next, elementProps?.control?.className)} type="button" hidden={images.length < 2} disabled={images.length < 2} onClick={() => move(1)} aria-label={t(lang, 'nextImage')}><ChevronRightIcon /></button>
    <div {...elementProps?.dots} className={classNames(`${selectorPrefix}-dots`, styles.dots, elementProps?.dots?.className)} hidden={images.length < 2} aria-label={t(lang, 'imageCount', { current: index + 1, total: images.length })}>
      {images.map((url, position) => <span key={`${url}-${position}`} className={classNames(styles.dot, position === index && styles.active)} />)}
    </div>
  </div>;
};
