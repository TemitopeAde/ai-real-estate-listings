import { app } from "@wix/astro/builders";
import aiRealEstateListings from "./extensions/dashboard/pages/ai-real-estate-listings/ai-real-estate-listings.extension.ts";

import dataCollections from "./extensions/backend/data-collections/data-collections.extension.ts";

import propertyListingsWidget from './extensions/site/widgets/property-listings-widget/property-listings-widget.extension.ts';

import propertyDetailWidget from './extensions/site/widgets/property-detail-widget/property-detail-widget.extension.ts';

import savedProperties from './extensions/site/embedded-scripts/saved-properties/saved-properties.extension.ts';


import subscriptionPurchased from './extensions/backend/events/subscription-purchased/subscription-purchased.extension.ts';


import subscriptionChanged from './extensions/backend/events/subscription-changed/subscription-changed.extension.ts';


import subscriptionCancelled from './extensions/backend/events/subscription-cancelled/subscription-cancelled.extension.ts';


import subscriptionConverted from './extensions/backend/events/subscription-converted/subscription-converted.extension.ts';


import subscriptionReactivated from './extensions/backend/events/subscription-reactivated/subscription-reactivated.extension.ts';


import appInstalled from './extensions/backend/events/app-installed/app-installed.extension.ts';


import appRemoved from './extensions/backend/events/app-removed/app-removed.extension.ts';


import subscriptionTransferred from './extensions/backend/events/subscription-transferred/subscription-transferred.extension.ts';


export default app()
  .use(aiRealEstateListings)
  .use(dataCollections)
  .use(propertyListingsWidget)
  .use(propertyDetailWidget)
  .use(savedProperties).use(subscriptionPurchased).use(subscriptionChanged).use(subscriptionCancelled).use(subscriptionConverted).use(subscriptionReactivated).use(appInstalled).use(appRemoved).use(subscriptionTransferred);
