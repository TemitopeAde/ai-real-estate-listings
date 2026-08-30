import { app } from '@wix/astro/builders';
import aiRealEstateListings from './extensions/dashboard/pages/ai-real-estate-listings/ai-real-estate-listings.extension.ts';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

export default app()
  .use(aiRealEstateListings).use(dataCollections);
