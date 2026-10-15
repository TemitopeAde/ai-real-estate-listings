import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'saved-properties';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Saved Properties',
  fields: [
    {
      type: 'TEXT',
      displayName: 'Member ID',
      key: 'memberId',
    },
    {
      type: 'TEXT',
      displayName: 'Listing ID',
      key: 'listingId',
    },
    {
      type: 'DATETIME',
      displayName: 'Saved At',
      key: 'savedAt',
    },
  ],
  displayField: 'listingId',
  dataPermissions: {
    itemInsert: 'CMS_EDITOR',
    itemRead: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  indexes: [{ fields: [{ path: 'memberId' }, { path: 'listingId' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
