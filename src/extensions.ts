import { app } from "@wix/astro/builders";
import aiRealEstateListings from "./extensions/dashboard/pages/ai-real-estate-listings/ai-real-estate-listings.extension.ts";

import dataCollections from "./extensions/backend/data-collections/data-collections.extension.ts";

import appPlanPurchased from "./extensions/backend/events/app-plan-purchased/app-plan-purchased.extension.ts";

import appPlanConvertedToPaid from "./extensions/backend/events/app-plan-converted-to-paid/app-plan-converted-to-paid.extension.ts";

import appPlanChanged from "./extensions/backend/events/app-plan-changed/app-plan-changed.extension.ts";

import appInstanceRemoved from "./extensions/backend/events/app-instance-removed/app-instance-removed.extension.ts";

import myEvent from "./extensions/backend/events/my-event/my-event.extension.ts";

import propertyListingsWidget from './extensions/site/widgets/property-listings-widget/property-listings-widget.extension.ts';

import propertyDetailWidget from './extensions/site/widgets/property-detail-widget/property-detail-widget.extension.ts';

export default app()
  .use(aiRealEstateListings)
  .use(dataCollections)
  .use(appPlanPurchased)
  .use(appPlanConvertedToPaid)
  .use(appPlanChanged)
  .use(appInstanceRemoved)
  .use(myEvent).use(propertyListingsWidget).use(propertyDetailWidget);
