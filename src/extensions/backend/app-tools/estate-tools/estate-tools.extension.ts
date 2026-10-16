import { extensions } from '@wix/astro/builders'

const LISTING_STATUSES = ['draft', 'active', 'under_offer', 'sold', 'archived'];
const PROPERTY_TYPES = ['house', 'apartment', 'condo', 'townhouse', 'land', 'office', 'retail', 'industrial', 'mixed-use', 'other'];
const TRANSACTION_TYPES = ['sale', 'rent', 'lease'];
const QUOTE_STATUSES = ['new', 'contacted', 'quoted', 'closed'];
const WRITER_STYLES = ['professional', 'luxury', 'short', 'seo', 'social'];

const result = { ok: { type: 'boolean' }, message: { type: 'string', description: 'Explanation when ok is false (e.g. plan limit or validation error).' } };

const listingSummary = {
  type: 'object',
  properties: {
    id: { type: 'string' }, title: { type: 'string' }, status: { type: 'string' },
    propertyType: { type: 'string' }, transactionType: { type: 'string' },
    price: { type: 'number' }, currency: { type: 'string' }, city: { type: 'string' }, address: { type: 'string' },
    bedrooms: { type: 'number' }, bathrooms: { type: 'number' }, area: { type: 'number' }, areaUnit: { type: 'string' },
    viewCount: { type: 'number' }, updatedDate: { type: 'string' },
  },
};

const listingFields = {
  title: { type: 'string' },
  description: { type: 'string', description: 'Listing description (plain text or simple HTML).' },
  transactionType: { type: 'string', enum: TRANSACTION_TYPES },
  propertyType: { type: 'string', enum: PROPERTY_TYPES },
  status: { type: 'string', enum: LISTING_STATUSES },
  price: { type: 'number' },
  currency: { type: 'string', description: 'Three-letter ISO currency code, e.g. USD.' },
  area: { type: 'number' },
  areaUnit: { type: 'string', enum: ['sq ft', 'sq m', 'acres'] },
  city: { type: 'string' },
  bedrooms: { type: 'number' },
  bathrooms: { type: 'number' },
  yearBuilt: { type: 'number' },
  parkingSpaces: { type: 'number' },
  amenities: { type: 'array', items: { type: 'string' } },
  propertyCondition: { type: 'string', enum: ['new', 'good', 'needs_renovation'] },
  furnishingStatus: { type: 'string', enum: ['unfurnished', 'semi_furnished', 'furnished'] },
  tenure: { type: 'string', enum: ['freehold', 'leasehold'] },
  rentalFrequency: { type: 'string', enum: ['monthly', 'yearly'] },
  availabilityDate: { type: 'string', description: 'ISO date.' },
  serviceCharge: { type: 'number' },
  securityDeposit: { type: 'number' },
  agentName: { type: 'string' },
  agentEmail: { type: 'string' },
  agentPhone: { type: 'string' },
  address: { type: 'object', properties: { formatted: { type: 'string' }, streetAddress: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, country: { type: 'string' } } },
};

const quoteSummary = {
  type: 'object',
  properties: {
    id: { type: 'string' }, status: { type: 'string' }, archived: { type: 'boolean' },
    name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, message: { type: 'string' }, notes: { type: 'string' },
    listingId: { type: 'string' }, listingTitle: { type: 'string' }, listingPrice: { type: 'number' }, listingCurrency: { type: 'string' },
    createdDate: { type: 'string' },
  },
};

export default extensions.appTools({
  id: 'c7e39455-a9c4-4383-985d-a5ac3032eeca',
  name: 'estate-tools',
  // learn more about JSON Schema - https://json-schema.org/overview/what-is-jsonschema
  tools: [
    {
      methodName: 'search-listings',
      displayName: 'Search property listings',
      description: 'Searches the site owner\'s real estate listings and returns a page of matching properties with ID, title, status, type, sale/rent, price, city, bedrooms, bathrooms, area and views. Use this when the user asks to find, list, show or count their properties, e.g. "show my apartments for sale under 300k", "which listings are under offer", "3 bedroom homes in Austin", or needs a listing ID for another tool. All filters are optional.',
      activated: true,
      requestSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Text matched against title, city and description.' },
          status: { type: 'string', enum: LISTING_STATUSES },
          propertyType: { type: 'string', enum: PROPERTY_TYPES },
          transactionType: { type: 'string', enum: TRANSACTION_TYPES },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          minBedrooms: { type: 'number' },
          includeArchived: { type: 'boolean', description: 'Include archived listings (excluded by default).' },
          page: { type: 'number', description: 'Zero-based page number.' },
          pageSize: { type: 'number', description: '1-25, default 10.' },
        },
      },
      responseSchema: { type: 'object', properties: { ...result, totalCount: { type: 'number' }, hasNext: { type: 'boolean' }, page: { type: 'number' }, listings: { type: 'array', items: listingSummary } } },
    },
    {
      methodName: 'get-listing',
      displayName: 'Get listing details',
      description: 'Returns the full details of one property listing: description, amenities, condition, furnishing, tenure, availability, fees, agent contact, images and virtual tour availability. Use this when the user asks about a specific property\'s details or before editing it. Requires the listingId (find it with search-listings).',
      activated: true,
      requestSchema: { type: 'object', properties: { listingId: { type: 'string' } }, required: ['listingId'] },
      responseSchema: { type: 'object', properties: { ...result, listing: { type: 'object' } } },
    },
    {
      methodName: 'create-listing',
      displayName: 'Create a listing',
      description: 'Creates a new property listing. Use this when the user wants to add, create or post a new property. Requires title, transactionType (sale/rent/lease), propertyType, price, currency (ISO code), area, areaUnit and city; ask the user for any that are missing. New listings are saved as draft unless a status is given. Fails with a message if the plan\'s listing limit is reached.',
      activated: true,
      requestSchema: { type: 'object', properties: listingFields, required: ['title', 'transactionType', 'propertyType', 'price', 'currency', 'area', 'areaUnit', 'city'] },
      responseSchema: { type: 'object', properties: { ...result, listing: listingSummary } },
    },
    {
      methodName: 'update-listing',
      displayName: 'Update a listing',
      description: 'Updates an existing property listing. Use this to change price, status (e.g. mark as sold, under offer, active, draft or archive it), title, description, bedrooms, amenities, agent contact or any other listing field, or to save a description from write-listing-description. Requires listingId and a changes object containing only the fields to change. Editing (other than archiving) needs the Pro or Business plan.',
      activated: true,
      requestSchema: {
        type: 'object',
        properties: { listingId: { type: 'string' }, changes: { type: 'object', properties: listingFields, description: 'Only the fields to change.' } },
        required: ['listingId', 'changes'],
      },
      responseSchema: { type: 'object', properties: { ...result, listing: listingSummary } },
    },
    {
      methodName: 'get-portfolio-summary',
      displayName: 'Portfolio summary',
      description: 'Returns an overview of the property portfolio: total listings, how many are active, under offer and sold, how many are publicly visible, and the 5 most recently updated listings. Use this for questions like "how are my listings doing", "how many properties do I have", or "what did I update recently".',
      activated: true,
      requestSchema: { type: 'object', properties: {} },
      responseSchema: { type: 'object', properties: { ...result, total: { type: 'number' }, active: { type: 'number' }, underOffer: { type: 'number' }, sold: { type: 'number' }, publiclyVisible: { type: 'number' }, recentListings: { type: 'array', items: listingSummary } } },
    },
    {
      methodName: 'get-listing-analytics',
      displayName: 'Listing analytics',
      description: 'Returns portfolio analytics: breakdowns by status, property type and sale/rent, top 5 cities, average price per currency, number of AI-ready listings and new listings per month for the last 6 months. Use this for questions about trends, averages, distribution or performance of the portfolio. Available on Pro and Business plans.',
      activated: true,
      requestSchema: { type: 'object', properties: {} },
      responseSchema: { type: 'object', properties: { ...result, total: { type: 'number' }, aiReady: { type: 'number' }, statusBreakdown: { type: 'array' }, propertyBreakdown: { type: 'array' }, transactionBreakdown: { type: 'array' }, activityByMonth: { type: 'array' }, topCities: { type: 'array' }, averagePriceByCurrency: { type: 'array' } } },
    },
    {
      methodName: 'list-quote-requests',
      displayName: 'List quote requests',
      description: 'Lists quote requests (buyer and renter enquiries) submitted from property pages, newest first, with contact details, message, status, notes and the related listing. Use this when the user asks about leads, enquiries, inquiries, quote requests or who is interested in a property. Optional filters: status (new/contacted/quoted/closed), search by listing title, includeArchived.',
      activated: true,
      requestSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: QUOTE_STATUSES },
          search: { type: 'string', description: 'Text matched against the listing title.' },
          includeArchived: { type: 'boolean' },
          page: { type: 'number' },
          pageSize: { type: 'number', description: '1-25, default 10.' },
        },
      },
      responseSchema: { type: 'object', properties: { ...result, totalCount: { type: 'number' }, hasNext: { type: 'boolean' }, page: { type: 'number' }, quoteRequests: { type: 'array', items: quoteSummary } } },
    },
    {
      methodName: 'update-quote-request',
      displayName: 'Update a quote request',
      description: 'Updates a quote request: change its status (new, contacted, quoted, closed), replace its internal notes, or archive/unarchive it. Use this when the user says they contacted a lead, sent a quote, closed an enquiry, wants to add a note, or archive a request. Requires quoteRequestId (find it with list-quote-requests).',
      activated: true,
      requestSchema: {
        type: 'object',
        properties: { quoteRequestId: { type: 'string' }, status: { type: 'string', enum: QUOTE_STATUSES }, notes: { type: 'string' }, archived: { type: 'boolean' } },
        required: ['quoteRequestId'],
      },
      responseSchema: { type: 'object', properties: { ...result, quoteRequest: quoteSummary } },
    },
    {
      methodName: 'write-listing-description',
      displayName: 'Write a listing description',
      description: 'Generates property marketing copy with the AI Listing Writer in a chosen style: professional, luxury, short, seo or social. Use this when the user asks to write, rewrite or improve a listing description or social caption. Pass a listingId to use that listing\'s facts, or give location and other facts directly. The text is returned but not saved; call update-listing with changes.description to save it. Available on Pro and Business plans.',
      activated: true,
      requestSchema: {
        type: 'object',
        properties: {
          listingId: { type: 'string' },
          style: { type: 'string', enum: WRITER_STYLES },
          location: { type: 'string' }, bedrooms: { type: 'string' }, bathrooms: { type: 'string' },
          propertyType: { type: 'string' }, amenities: { type: 'string' }, furnishing: { type: 'string' }, price: { type: 'string' },
        },
      },
      responseSchema: { type: 'object', properties: { ...result, style: { type: 'string' }, listingId: { type: 'string' }, description: { type: 'string' } } },
    },
    {
      methodName: 'get-plan-details',
      displayName: 'Plan and usage',
      description: 'Returns the app subscription plan (basic, pro or business), trial status, listing limit and current usage, number of publicly visible listings and which features are enabled. Use this when the user asks what plan they are on, how many listings they can add, why a feature is unavailable, or whether they should upgrade.',
      activated: true,
      requestSchema: { type: 'object', properties: {} },
      responseSchema: { type: 'object', properties: { ...result, planId: { type: 'string' }, accessStatus: { type: 'string' }, isTrial: { type: 'boolean' }, listingCap: {}, listingCount: { type: 'number' }, activeListingCount: { type: 'number' }, publiclyVisibleListings: { type: 'number' }, features: { type: 'object' } } },
    },
  ],
});
