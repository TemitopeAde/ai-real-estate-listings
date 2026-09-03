import type { DataCollection } from '@wix/astro/builders';

export const collectionIdSuffix = 'quote-requests';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Invoice Requests',
  fields: [
    { type: 'TEXT', displayName: 'Property ID', key: 'listingId' },
    { type: 'TEXT', displayName: 'Property Title', key: 'listingTitle' },
    { type: 'TEXT', displayName: 'First Name', key: 'firstName' },
    { type: 'TEXT', displayName: 'Last Name', key: 'lastName' },
    { type: 'TEXT', displayName: 'Email', key: 'email', encrypted: true },
    { type: 'TEXT', displayName: 'Phone', key: 'phone', encrypted: true },
    { type: 'TEXT', displayName: 'Country', key: 'country' },
    { type: 'TEXT', displayName: 'State or Province', key: 'state' },
    { type: 'TEXT', displayName: 'City', key: 'city' },
    { type: 'TEXT', displayName: 'Postal Code', key: 'postalCode' },
    { type: 'TEXT', displayName: 'Street Address', key: 'streetAddress' },
    { type: 'RICH_TEXT', displayName: 'Message', key: 'message' },
    { type: 'TEXT', displayName: 'Status', key: 'status' },
    { type: 'TEXT', displayName: 'Customer Contact ID', key: 'contactId' },
    { type: 'TEXT', displayName: 'Invoice ID', key: 'invoiceId' },
    { type: 'NUMBER', displayName: 'Invoice Amount', key: 'invoiceAmount' },
    { type: 'TEXT', displayName: 'Invoice Currency', key: 'invoiceCurrency' },
    { type: 'DATETIME', displayName: 'Invoice Issue Date', key: 'invoiceIssueDate' },
    { type: 'DATETIME', displayName: 'Invoice Due Date', key: 'invoiceDueDate' },
  ],
  displayField: 'listingTitle',
  dataPermissions: {
    itemInsert: 'CMS_EDITOR',
    itemRead: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  indexes: [],
  initialData: [],
} satisfies DataCollection;
