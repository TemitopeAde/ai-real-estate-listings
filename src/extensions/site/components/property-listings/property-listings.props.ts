import type { A11y, Direction, Link } from '@wix/editor-react-types';
import { DEFAULT_LISTING_WIDGET_CONFIG } from '../../../../lib/site-widget';
import type { WidgetLanguageSetting } from '../../../../lib/widget-i18n';
import type { GalleryParts } from '../property-parts/gallery';

type Part = { className?: string };
export type PropertyListingsProps = {
  id: string;
  className?: string;
  direction?: Direction;
  a11y?: A11y;
  title: string;
  subtitle: string;
  language: WidgetLanguageSetting;
  enableComparison: boolean;
  loadingMode: 'load-more' | 'infinite' | 'pagination';
  /** @min 1 @max 100 */
  pageSize: number;
  loadMoreLabel: string;
  previousLabel: string;
  nextLabel: string;
  detailPage: Link;
  enableSearch: boolean;
  enableTransactionFilter: boolean;
  enablePropertyTypeFilter: boolean;
  enablePriceFilter: boolean;
  enableBedroomsFilter: boolean;
  elementProps?: {
    compare?: Part;
    heading?: Part;
    subtitle?: Part;
    filters?: Part;
    search?: Part;
    select?: Part;
    price?: Part;
    reset?: Part;
    list?: Part;
    card?: Part;
    gallery?: Part;
    image?: GalleryParts['image'];
    imageControl?: GalleryParts['control'];
    imageDots?: GalleryParts['dots'];
    save?: Part;
    cardTitle?: Part;
    cardPrice?: Part;
    location?: Part;
    metadata?: Part;
    detailLink?: Part;
    pagination?: Part;
    pageButton?: Part;
    message?: Part;
  };
};

const config = DEFAULT_LISTING_WIDGET_CONFIG;
export const defaultProps = {
  title: config.title,
  subtitle: config.subtitle,
  language: config.language,
  enableComparison: config.enableComparison,
  loadingMode: config.loadingMode,
  pageSize: config.pageSize,
  loadMoreLabel: config.loadMoreLabel,
  previousLabel: config.previousLabel,
  nextLabel: config.nextLabel,
  detailPage: { href: '/property-details' },
  enableSearch: config.showSearch,
  enableTransactionFilter: config.showTransactionFilter,
  enablePropertyTypeFilter: config.showPropertyTypeFilter,
  enablePriceFilter: config.showPriceFilter,
  enableBedroomsFilter: config.showBedroomsFilter,
} satisfies Omit<PropertyListingsProps, 'id' | 'className'>;
