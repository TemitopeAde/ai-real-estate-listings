import type { A11y, Direction, Link } from '@wix/editor-react-types';
import { DEFAULT_DETAIL_WIDGET_CONFIG } from '../../../../lib/site-widget';
import type { WidgetLanguageSetting } from '../../../../lib/widget-i18n';
import type { GalleryParts } from '../property-parts/gallery';

type Part = { className?: string };
export type PropertyDetailProps = {
  id: string;
  className?: string;
  direction?: Direction;
  a11y?: A11y;
  language: WidgetLanguageSetting;
  enableComparison: boolean;
  detailPage: Link;
  /** Optional fixed property; otherwise read the id query parameter. */
  listingId?: string;
  relatedTitle: string;
  relatedSubtitle: string;
  /** @min 1 @max 8 */
  relatedCount: number;
  enableRelatedListings: boolean;
  enableAssistant: boolean;
  enableSocialShare: boolean;
  enableMortgageCalculator: boolean;
  enableFloorPlans: boolean;
  enableBrochures: boolean;
  enableVideos: boolean;
  elementProps?: {
    compare?: Part;
    card?: Part;
    gallery?: Part;
    image?: GalleryParts['image'];
    imageControl?: GalleryParts['control'];
    imageDots?: GalleryParts['dots'];
    content?: Part;
    backLink?: Part;
    heading?: Part;
    location?: Part;
    price?: Part;
    save?: Part;
    views?: Part;
    share?: Part;
    assistant?: Part;
    tour?: Part;
    videos?: Part;
    description?: Part;
    metadata?: Part;
    mortgage?: Part;
    map?: Part;
    amenities?: Part;
    contact?: Part;
    contactLink?: Part;
    related?: Part;
    relatedTitle?: Part;
    relatedSubtitle?: Part;
    relatedControl?: Part;
    relatedList?: Part;
    relatedCard?: Part;
    relatedLink?: Part;
    message?: Part;
  };
};

const config = DEFAULT_DETAIL_WIDGET_CONFIG;
export const defaultProps = {
  language: config.language,
  enableComparison: config.enableComparison,
  detailPage: { href: '/property-details' },
  listingId: '',
  relatedTitle: config.featuredTitle,
  relatedSubtitle: config.featuredSubtitle,
  relatedCount: config.featuredCount,
  enableRelatedListings: config.showFeaturedListings,
  enableAssistant: config.showAiAssistant,
  enableSocialShare: config.showSocialShare,
  enableMortgageCalculator: config.showMortgageCalculator,
  enableFloorPlans: config.showFloorPlans,
  enableBrochures: config.showBrochures,
  enableVideos: config.showVideos,
} satisfies Omit<PropertyDetailProps, 'id' | 'className'>;
