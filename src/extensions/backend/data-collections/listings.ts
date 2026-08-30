import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "listings";

export default {
  idSuffix: collectionIdSuffix,
  displayName: "Listings",
  fields: [
    {
      type: "TEXT",
      displayName: "Title",
      key: "title",
    },
    {
      type: "RICH_TEXT",
      displayName: "Description",
      key: "description",
    },
    {
      type: "TEXT",
      displayName: "Transaction Type",
      key: "transactionType",
    },
    {
      type: "TEXT",
      displayName: "Property Type",
      key: "propertyType",
    },
    {
      type: "TEXT",
      displayName: "Status",
      key: "status",
    },
    {
      type: "NUMBER",
      displayName: "Price",
      key: "price",
    },
    {
      type: "TEXT",
      displayName: "Currency",
      key: "currency",
    },
    {
      type: "NUMBER",
      displayName: "Area",
      key: "area",
    },
    {
      type: "TEXT",
      displayName: "Area Unit",
      key: "areaUnit",
    },
    {
      type: "NUMBER",
      displayName: "Bedrooms",
      key: "bedrooms",
    },
    {
      type: "NUMBER",
      displayName: "Bathrooms",
      key: "bathrooms",
    },
    {
      type: "NUMBER",
      displayName: "Year Built",
      key: "yearBuilt",
    },
    {
      type: "NUMBER",
      displayName: "Parking Spaces",
      key: "parkingSpaces",
    },
    {
      type: "BOOLEAN",
      displayName: "Furnished",
      key: "furnished",
    },
    {
      type: "ARRAY_STRING",
      displayName: "Amenities",
      key: "amenities",
    },
    {
      type: "TEXT",
      displayName: "Property Condition",
      key: "propertyCondition",
    },
    { type: "TEXT", displayName: "Furnishing Status", key: "furnishingStatus" },
    { type: "TEXT", displayName: "Tenure", key: "tenure" },
    { type: "TEXT", displayName: "Rental Frequency", key: "rentalFrequency" },
    {
      type: "DATETIME",
      displayName: "Availability Date",
      key: "availabilityDate",
    },
    { type: "NUMBER", displayName: "Service Charge", key: "serviceCharge" },
    { type: "NUMBER", displayName: "Security Deposit", key: "securityDeposit" },
    { type: "TEXT", displayName: "Agent Name", key: "agentName" },
    { type: "TEXT", displayName: "Agent Phone", key: "agentPhone" },
    { type: "TEXT", displayName: "Agent Email", key: "agentEmail" },
    { type: "NUMBER", displayName: "Latitude", key: "latitude" },
    { type: "NUMBER", displayName: "Longitude", key: "longitude" },
    { type: "URL", displayName: "Virtual Tour URL", key: "virtualTourUrl" },
    { type: "NUMBER", displayName: "View Count", key: "viewCount" },
    { type: "ARRAY_DOCUMENT", displayName: "View Events", key: "viewEvents" },
    {
      type: "ADDRESS",
      displayName: "Address",
      key: "address",
    },
    {
      type: "TEXT",
      displayName: "City",
      key: "city",
    },
    {
      type: "IMAGE",
      displayName: "Primary Image",
      key: "primaryImage",
    },
    {
      type: "MEDIA_GALLERY",
      displayName: "Gallery",
      key: "gallery",
    },
    {
      type: "RICH_TEXT",
      displayName: "AI Description",
      key: "aiDescription",
    },
    {
      type: "ARRAY_STRING",
      displayName: "AI Tags",
      key: "aiTags",
    },
    {
      type: "DATETIME",
      displayName: "AI Generated At",
      key: "aiGeneratedAt",
    },
  ],
  displayField: "title",
  dataPermissions: {
    itemInsert: "CMS_EDITOR",
    itemRead: "CMS_EDITOR",
    itemRemove: "CMS_EDITOR",
    itemUpdate: "CMS_EDITOR",
  },
  indexes: [
    {
      fields: [
        { path: "status", order: "ASC" },
        { path: "_updatedDate", order: "DESC" },
      ],
    },
    {
      fields: [{ path: "propertyType", order: "ASC" }],
    },
    {
      fields: [{ path: "city", order: "ASC" }],
    },
  ],
  initialData: [],
} satisfies DataCollection;
