import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'quote-requests';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Quote Requests',
  fields: [
    {
      type: 'REFERENCE',
      displayName: 'Property',
      key: 'listing',
      referenceOptions: {
        referencedCollectionId: '@admin14744/ai-real-estate-listings/listings',
      },
    },
    { type: 'TEXT', displayName: 'Listing ID', key: 'listingId' },
    { type: 'TEXT', displayName: 'Listing Title', key: 'listingTitle' },
    { type: 'NUMBER', displayName: 'Listing Price', key: 'listingPrice' },
    { type: 'TEXT', displayName: 'Listing Currency', key: 'listingCurrency' },
    { type: 'TEXT', displayName: 'Listing City', key: 'listingCity' },
    { type: 'TEXT', displayName: 'Listing Address', key: 'listingAddress' },
    { type: 'IMAGE', displayName: 'Listing Primary Image', key: 'listingPrimaryImage' },
    { type: 'TEXT', displayName: 'First Name', key: 'firstName' },
    { type: 'TEXT', displayName: 'Last Name', key: 'lastName' },
    { type: 'TEXT', displayName: 'Email', key: 'email' },
    { type: 'TEXT', displayName: 'Phone', key: 'phone' },
    { type: 'TEXT', displayName: 'Message', key: 'message' },
    { type: 'TEXT', displayName: 'Member ID', key: 'memberId' },
    { type: 'TEXT', displayName: 'Status', key: 'status' },
    { type: 'TEXT', displayName: 'Internal Notes', key: 'notes' },
    { type: 'BOOLEAN', displayName: 'Archived', key: 'archived' },
  ],
  displayField: 'listingTitle',
  dataPermissions: {
    itemInsert: 'ANYONE',
    itemRead: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  indexes: [
    { fields: [{ path: 'email' }, { path: 'listingId' }, { path: '_createdDate' }] },
    { fields: [{ path: 'status' }, { path: '_createdDate' }] },
  ],
  initialData: [],
} satisfies DataCollection;
