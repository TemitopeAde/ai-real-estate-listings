import { extensions } from '@wix/astro/builders'

import listingsCollection from './listings';
import savedPropertiesCollection from './saved-properties';
import quoteRequestsCollection from './quote-requests';
import emailTemplatesCollection from './email-templates';

export default extensions.dataCollections({
  id: 'ef8c0444-6626-47d3-9c12-710c54164385',
  name: 'Data Collections',
  collections: [listingsCollection, savedPropertiesCollection, quoteRequestsCollection, emailTemplatesCollection],
});

