import { app } from "@wix/astro/builders";
import aiRealEstateListings from "./extensions/dashboard/pages/ai-real-estate-listings/ai-real-estate-listings.extension.ts";

import dataCollections from "./extensions/backend/data-collections/data-collections.extension.ts";

import propertyListingsWidget from './extensions/site/widgets/property-listings-widget/property-listings-widget.extension.ts';

import propertyDetailWidget from './extensions/site/widgets/property-detail-widget/property-detail-widget.extension.ts';

import savedProperties from './extensions/site/embedded-scripts/saved-properties/saved-properties.extension.ts';


export default app()
  .use(aiRealEstateListings)
  .use(dataCollections)
  .use(propertyListingsWidget)
  .use(propertyDetailWidget)
  .use(savedProperties);
