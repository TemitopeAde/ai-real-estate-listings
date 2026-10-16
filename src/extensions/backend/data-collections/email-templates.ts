import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'email-templates';

/** Site-owner-editable emails. One item per email, keyed by a fixed _id (e.g. "quote-confirmation"). */
export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Email Templates',
  fields: [
    { type: 'BOOLEAN', displayName: 'Enabled', key: 'enabled' },
    { type: 'TEXT', displayName: 'Subject', key: 'subject' },
    { type: 'TEXT', displayName: 'Body', key: 'body' },
  ],
  displayField: 'subject',
  dataPermissions: {
    itemInsert: 'CMS_EDITOR',
    itemRead: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  initialData: [],
} satisfies DataCollection;
