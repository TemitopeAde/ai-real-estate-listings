import { useEffect, useState, type FC } from 'react';
import classNames from 'classnames';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t, type WidgetLangCode } from '../../../../lib/widget-i18n';
import styles from './gallery.module.css';

type Part = { className?: string };
export type GalleryParts = { image?: Part | undefined; control?: Part | undefined; dots?: Part | undefined };

type GalleryProps = {
  className?: string;
  images: Array<string>;
  title: string;
  lang: WidgetLangCode;
  elementProps?: GalleryParts;
};

export const Gallery: FC<GalleryProps> = (props) => {
  const { className, images, title, lang, elementProps } = props;
  const [index, setIndex] = useState(0);
  const imagesKey = images.join('|');
  useEffect(() => setIndex(0), [imagesKey]);
  const current = images[index] ?? images[0];
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);
  return <div className={classNames('property-gallery', styles.root, className)}>
    <img {...elementProps?.image} className={classNames('property-gallery-image', styles.image, elementProps?.image?.className)} src={current} alt={current ? title : ''} hidden={!current} loading="lazy" />
    {!current ? <div className={styles.empty} aria-hidden="true" /> : null}
    <button {...elementProps?.control} className={classNames('property-gallery-control', styles.control, styles.previous, elementProps?.control?.className)} type="button" hidden={images.length < 2} disabled={images.length < 2} onClick={() => move(-1)} aria-label={t(lang, 'previousImage')}><ChevronLeft size={16} aria-hidden="true" /></button>
    <button {...elementProps?.control} className={classNames('property-gallery-control', styles.control, styles.next, elementProps?.control?.className)} type="button" hidden={images.length < 2} disabled={images.length < 2} onClick={() => move(1)} aria-label={t(lang, 'nextImage')}><ChevronRight size={16} aria-hidden="true" /></button>
    <div {...elementProps?.dots} className={classNames('property-gallery-dots', styles.dots, elementProps?.dots?.className)} hidden={images.length < 2} aria-label={t(lang, 'imageCount', { current: index + 1, total: images.length })}>
      {images.map((url, position) => <span key={`${url}-${position}`} className={classNames(styles.dot, position === index && styles.active)} />)}
    </div>
  </div>;
};
