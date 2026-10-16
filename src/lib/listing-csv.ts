import {
  AREA_UNITS,
  FURNISHING_STATUSES,
  LISTING_STATUSES,
  PROPERTY_CONDITIONS,
  PROPERTY_TYPES,
  RENTAL_FREQUENCIES,
  TENURE_TYPES,
  TRANSACTION_TYPES,
  getPanoramaImages,
  type Listing,
  type ListingInput,
} from "./listing-types.ts";

/**
 * CSV import/export for listings. Everything here is pure so the dashboard
 * (live validation in the review grid) and the import API (authoritative
 * re-validation before saving) share exactly the same rules.
 */

export const LISTING_CSV_MAX_ROWS = 1000;
export const LISTING_CSV_BATCH_SIZE = 100;
export const LISTING_CSV_MAX_GALLERY = 50;
export const LISTING_CSV_MAX_PANORAMAS = 10;
export const LISTING_CSV_LIST_SEPARATOR = "|";

type EnumOption = { readonly value: string; readonly label: string };

export type ListingCsvKind =
  | "id"
  | "readonly"
  | "text"
  | "longtext"
  | "enum"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "list"
  | "url"
  | "urls"
  | "email"
  | "phone"
  | "currency"
  | "latitude"
  | "longitude";

export interface ListingCsvColumn {
  key: string;
  label: string;
  kind: ListingCsvKind;
  requiredOnCreate?: boolean;
  options?: readonly EnumOption[];
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  maxItems?: number;
}

const currentYear = new Date().getFullYear();

export const LISTING_CSV_COLUMNS = [
  { key: "id", label: "ID", kind: "id" },
  { key: "lastUpdated", label: "Last updated", kind: "readonly" },
  { key: "title", label: "Title", kind: "text", requiredOnCreate: true, maxLength: 200 },
  { key: "description", label: "Description", kind: "longtext", maxLength: 30000 },
  { key: "transactionType", label: "Transaction type", kind: "enum", requiredOnCreate: true, options: TRANSACTION_TYPES },
  { key: "propertyType", label: "Property type", kind: "enum", requiredOnCreate: true, options: PROPERTY_TYPES },
  { key: "status", label: "Status", kind: "enum", requiredOnCreate: true, options: LISTING_STATUSES },
  { key: "price", label: "Price", kind: "number", requiredOnCreate: true, min: 0 },
  { key: "currency", label: "Currency", kind: "currency", requiredOnCreate: true },
  { key: "area", label: "Area", kind: "number", requiredOnCreate: true, min: 0 },
  { key: "areaUnit", label: "Area unit", kind: "enum", requiredOnCreate: true, options: AREA_UNITS },
  { key: "bedrooms", label: "Bedrooms", kind: "integer", min: 0, max: 1000 },
  { key: "bathrooms", label: "Bathrooms", kind: "number", min: 0, max: 1000, step: 0.5 },
  { key: "yearBuilt", label: "Year built", kind: "integer", min: 1800, max: currentYear + 5 },
  { key: "parkingSpaces", label: "Parking spaces", kind: "integer", min: 0, max: 10000 },
  { key: "furnished", label: "Furnished", kind: "boolean" },
  { key: "furnishingStatus", label: "Furnishing status", kind: "enum", options: FURNISHING_STATUSES },
  { key: "propertyCondition", label: "Property condition", kind: "enum", options: PROPERTY_CONDITIONS },
  { key: "tenure", label: "Tenure", kind: "enum", options: TENURE_TYPES },
  { key: "rentalFrequency", label: "Rental frequency", kind: "enum", options: RENTAL_FREQUENCIES },
  { key: "availabilityDate", label: "Availability date", kind: "date" },
  { key: "serviceCharge", label: "Service charge", kind: "number", min: 0 },
  { key: "securityDeposit", label: "Security deposit", kind: "number", min: 0 },
  { key: "amenities", label: "Amenities", kind: "list", maxItems: 50, maxLength: 60 },
  { key: "country", label: "Country", kind: "text", maxLength: 100 },
  { key: "state", label: "State", kind: "text", maxLength: 100 },
  { key: "city", label: "City", kind: "text", requiredOnCreate: true, maxLength: 100 },
  { key: "streetAddress", label: "Street address", kind: "text", maxLength: 300 },
  { key: "latitude", label: "Latitude", kind: "latitude" },
  { key: "longitude", label: "Longitude", kind: "longitude" },
  { key: "agentName", label: "Agent name", kind: "text", maxLength: 120 },
  { key: "agentPhone", label: "Agent phone", kind: "phone" },
  { key: "agentEmail", label: "Agent email", kind: "email" },
  { key: "primaryImage", label: "Primary image", kind: "url" },
  { key: "galleryImages", label: "Gallery images", kind: "urls", maxItems: LISTING_CSV_MAX_GALLERY },
  { key: "panoramaImages", label: "Panorama images", kind: "urls", maxItems: LISTING_CSV_MAX_PANORAMAS },
] as const satisfies readonly ListingCsvColumn[];

export type ListingCsvKey = (typeof LISTING_CSV_COLUMNS)[number]["key"];
export type ListingCsvRow = Record<ListingCsvKey, string>;
export type ListingCsvErrors = Partial<Record<ListingCsvKey | "row", string>>;
export type ListingCsvMode = "create" | "update";

const COLUMN_BY_KEY = new Map<string, ListingCsvColumn>(
  LISTING_CSV_COLUMNS.map((column) => [column.key, column]),
);

export function getCsvColumn(key: ListingCsvKey): ListingCsvColumn {
  return COLUMN_BY_KEY.get(key)!;
}

export const REQUIRED_CSV_KEYS = LISTING_CSV_COLUMNS.filter(
  (column: ListingCsvColumn) => column.requiredOnCreate,
).map((column) => column.key);

export function emptyCsvRow(): ListingCsvRow {
  return Object.fromEntries(
    LISTING_CSV_COLUMNS.map((column) => [column.key, ""]),
  ) as ListingCsvRow;
}

export function csvRowMode(row: Pick<ListingCsvRow, "id">): ListingCsvMode {
  return row.id.trim() ? "update" : "create";
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/** RFC 4180 parser: quoted fields, escaped quotes, CRLF/LF, leading BOM. */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && field === "") {
      quoted = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records.filter((values) => values.some((value) => value.trim() !== ""));
}

function headerToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const HEADER_LOOKUP = new Map<string, ListingCsvKey>();
for (const column of LISTING_CSV_COLUMNS) {
  HEADER_LOOKUP.set(headerToken(column.key), column.key);
  HEADER_LOOKUP.set(headerToken(column.label), column.key);
}
HEADER_LOOKUP.set("gallery", "galleryImages");
HEADER_LOOKUP.set("images", "galleryImages");
HEADER_LOOKUP.set("panorama", "panoramaImages");
HEADER_LOOKUP.set("address", "streetAddress");

export interface ParsedListingCsv {
  rows: ListingCsvRow[];
  unknownHeaders: string[];
  missingRequiredHeaders: ListingCsvKey[];
  duplicateHeaders: string[];
  fileErrors: string[];
}

export function parseListingCsv(text: string): ParsedListingCsv {
  const records = parseCsv(text);
  const result: ParsedListingCsv = {
    rows: [],
    unknownHeaders: [],
    missingRequiredHeaders: [],
    duplicateHeaders: [],
    fileErrors: [],
  };
  const [headers, ...body] = records;
  if (!headers) {
    result.fileErrors.push("The file is empty.");
    return result;
  }

  const keys = headers.map((header) => {
    const key = HEADER_LOOKUP.get(headerToken(header));
    if (!key && header.trim()) result.unknownHeaders.push(header.trim());
    return key;
  });
  const seen = new Set<ListingCsvKey>();
  keys.forEach((key, index) => {
    if (!key) return;
    if (seen.has(key)) result.duplicateHeaders.push(headers[index]!.trim());
    seen.add(key);
  });
  if (result.duplicateHeaders.length > 0) {
    result.fileErrors.push(
      `Duplicate columns: ${result.duplicateHeaders.join(", ")}.`,
    );
  }

  // Not a file error: the review grid shows every column, so missing values
  // surface as per-cell "required" errors the user can fill in.
  result.missingRequiredHeaders = REQUIRED_CSV_KEYS.filter((key) => !seen.has(key));

  if (body.length === 0) result.fileErrors.push("The file has no listing rows.");
  if (body.length > LISTING_CSV_MAX_ROWS) {
    result.fileErrors.push(
      `The file has ${body.length} rows. Import at most ${LISTING_CSV_MAX_ROWS} at a time.`,
    );
  }

  result.rows = body.slice(0, LISTING_CSV_MAX_ROWS).map((values) => {
    const row = emptyCsvRow();
    keys.forEach((key, index) => {
      if (key) row[key] = values[index] ?? "";
    });
    return normalizeCsvRow(row);
  });
  return result;
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function normalizeEnum(value: string, options: readonly EnumOption[]): string {
  const token = headerToken(value);
  if (!token) return "";
  const match = options.find(
    (option) =>
      headerToken(option.value) === token || headerToken(option.label) === token,
  );
  return match ? match.value : value.trim();
}

const TRUE_VALUES = new Set(["true", "yes", "y", "1"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0"]);

function splitList(value: string): string[] {
  return value
    .split(LISTING_CSV_LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Trims cells and maps friendly spellings ("For Sale", "Yes") to stored values. */
export function normalizeCsvRow(row: ListingCsvRow): ListingCsvRow {
  const next = { ...row };
  for (const column of LISTING_CSV_COLUMNS as readonly ListingCsvColumn[]) {
    const key = column.key as ListingCsvKey;
    const raw = (next[key] ?? "").trim().replace(/^'(?=[=@+\-\t\r])/, "");
    let value = raw;
    if (column.kind === "enum" && column.options) value = normalizeEnum(raw, column.options);
    if (column.kind === "boolean") {
      const lower = raw.toLowerCase();
      if (TRUE_VALUES.has(lower)) value = "true";
      else if (FALSE_VALUES.has(lower)) value = "false";
    }
    if (column.kind === "currency") value = raw.toUpperCase();
    if (column.kind === "number" || column.kind === "integer") {
      value = raw.replace(/[,\s]/g, "");
    }
    if (column.kind === "list" || column.kind === "urls") {
      value = splitList(raw).join(LISTING_CSV_LIST_SEPARATOR);
    }
    next[key] = value;
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function isHttpUrl(value: string): boolean {
  if (!value || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname;
  } catch {
    return false;
  }
}

export function isWixMediaUrl(value: string): boolean {
  try {
    return /(^|\.)wixstatic\.com$/i.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-()\s]+$/;

function validateCell(column: ListingCsvColumn, value: string): string | undefined {
  if (!value) return undefined;
  const label = column.label;
  switch (column.kind) {
    case "id":
    case "readonly":
      return undefined;
    case "text":
    case "longtext":
      return column.maxLength && value.length > column.maxLength
        ? `${label} must be at most ${column.maxLength} characters.`
        : undefined;
    case "enum":
      return column.options?.some((option) => option.value === value)
        ? undefined
        : `${label} must be one of: ${column.options?.map((option) => option.value).join(", ")}.`;
    case "number":
    case "integer": {
      const number = Number(value);
      if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(number)) {
        return `${label} must be a number.`;
      }
      if (column.kind === "integer" && !Number.isInteger(number)) {
        return `${label} must be a whole number.`;
      }
      if (column.step && !Number.isInteger(number / column.step)) {
        return `${label} must be in steps of ${column.step}.`;
      }
      if (column.min !== undefined && number < column.min) {
        return column.min === 0
          ? `${label} cannot be negative.`
          : `${label} must be at least ${column.min}.`;
      }
      if (column.max !== undefined && number > column.max) {
        return `${label} must be at most ${column.max}.`;
      }
      return undefined;
    }
    case "latitude":
    case "longitude": {
      const limit = column.kind === "latitude" ? 90 : 180;
      const number = Number(value);
      if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(number)) {
        return `${label} must be a number.`;
      }
      return number < -limit || number > limit
        ? `${label} must be between -${limit} and ${limit}.`
        : undefined;
    }
    case "boolean":
      return value === "true" || value === "false"
        ? undefined
        : `${label} must be true/false or yes/no.`;
    case "date":
      return isIsoDate(value) ? undefined : `${label} must be a real date in YYYY-MM-DD format.`;
    case "currency":
      return /^[A-Z]{3}$/.test(value)
        ? undefined
        : `${label} must be a three-letter ISO code such as USD.`;
    case "email":
      return EMAIL_PATTERN.test(value) ? undefined : `${label} must be a valid email address.`;
    case "phone": {
      const digits = value.replace(/\D/g, "").length;
      if (!PHONE_PATTERN.test(value)) {
        return `${label} may only contain digits, spaces and + - ( ).`;
      }
      return digits < 5 || digits > 20 ? `${label} must have 5–20 digits.` : undefined;
    }
    case "url":
      return isHttpUrl(value)
        ? undefined
        : `${label} must be a full http(s) URL, e.g. https://example.com/photo.jpg.`;
    case "urls": {
      const urls = splitList(value);
      const bad = urls.find((url) => !isHttpUrl(url));
      if (bad) return `${label}: "${bad}" is not a valid http(s) URL. Separate URLs with "|".`;
      if (column.maxItems && urls.length > column.maxItems) {
        return `${label} can have at most ${column.maxItems} URLs.`;
      }
      return undefined;
    }
    case "list": {
      const items = splitList(value);
      if (column.maxItems && items.length > column.maxItems) {
        return `${label} can have at most ${column.maxItems} items.`;
      }
      const long = items.find((item) => column.maxLength && item.length > column.maxLength);
      return long
        ? `${label}: "${long.slice(0, 20)}…" is longer than ${column.maxLength} characters.`
        : undefined;
    }
  }
}

/** Per-cell errors for one row. Cross-field rules are included. */
export function validateCsvRow(row: ListingCsvRow): ListingCsvErrors {
  const errors: ListingCsvErrors = {};
  const mode = csvRowMode(row);

  for (const column of LISTING_CSV_COLUMNS as readonly ListingCsvColumn[]) {
    const key = column.key as ListingCsvKey;
    const value = row[key] ?? "";
    if (!value && column.requiredOnCreate && mode === "create") {
      errors[key] = `${column.label} is required.`;
      continue;
    }
    const error = validateCell(column, value);
    if (error) errors[key] = error;
  }

  if (row.id && !/^[A-Za-z0-9-]{1,64}$/.test(row.id)) {
    errors.id = "ID must be the listing ID from an export. Leave it empty to create a new listing.";
  }

  // Cross-field rules.
  if (
    !errors.transactionType &&
    (row.transactionType === "rent" || row.transactionType === "lease") &&
    !row.rentalFrequency &&
    mode === "create"
  ) {
    errors.rentalFrequency = "Rental frequency is required for rent and lease listings.";
  }
  if (Boolean(row.latitude) !== Boolean(row.longitude)) {
    const missing = row.latitude ? "longitude" : "latitude";
    errors[missing] ??= "Latitude and longitude must be provided together.";
  }
  const addressKeys = ["country", "state", "streetAddress"] as const;
  if (addressKeys.some((key) => row[key])) {
    for (const key of [...addressKeys, "city"] as const) {
      if (!row[key]) {
        errors[key] ??= `${getCsvColumn(key).label} is required when an address is given.`;
      }
    }
  }
  if (mode === "update" && Object.entries(row).every(([key, value]) => key === "id" || key === "lastUpdated" || !value)) {
    errors.row = "This update row has no values to change.";
  }

  return errors;
}

export interface CsvFileIssues {
  errors: ListingCsvErrors[];
  warnings: string[][];
}

/** Rules that need the whole file: duplicate IDs and likely duplicate listings. */
export function validateCsvRows(rows: ListingCsvRow[]): CsvFileIssues {
  const errors = rows.map(validateCsvRow);
  const warnings = rows.map((): string[] => []);
  const idRows = new Map<string, number[]>();
  const listingRows = new Map<string, number[]>();

  rows.forEach((row, index) => {
    if (row.id) idRows.set(row.id, [...(idRows.get(row.id) ?? []), index]);
    if (!row.id && row.title) {
      const key = [row.title, row.streetAddress, row.city]
        .map((part) => part.trim().toLowerCase())
        .join("|");
      listingRows.set(key, [...(listingRows.get(key) ?? []), index]);
    }
  });
  for (const indexes of idRows.values()) {
    if (indexes.length < 2) continue;
    for (const index of indexes) {
      errors[index]!.id = `This ID appears on rows ${indexes.map((i) => i + 1).join(", ")}. Each listing can only be updated once per import.`;
    }
  }
  for (const indexes of listingRows.values()) {
    if (indexes.length < 2) continue;
    for (const index of indexes) {
      warnings[index]!.push(
        `Possible duplicate of row ${indexes.filter((i) => i !== index).map((i) => i + 1).join(", ")} (same title, street address and city).`,
      );
    }
  }
  return { errors, warnings };
}

export function errorCount(errors: ListingCsvErrors): number {
  return Object.keys(errors).length;
}

/* ------------------------------------------------------------------ */
/* Conversion                                                          */
/* ------------------------------------------------------------------ */

const NUMBER_KEYS = [
  "price",
  "area",
  "bedrooms",
  "bathrooms",
  "yearBuilt",
  "parkingSpaces",
  "serviceCharge",
  "securityDeposit",
  "latitude",
  "longitude",
] as const;

const STRING_KEYS = [
  "title",
  "description",
  "transactionType",
  "propertyType",
  "status",
  "currency",
  "areaUnit",
  "furnishingStatus",
  "propertyCondition",
  "tenure",
  "rentalFrequency",
  "availabilityDate",
  "city",
  "agentName",
  "agentPhone",
  "agentEmail",
] as const;

/**
 * Builds the JSON body accepted by `parseListingInput` (create) or
 * `parseListingPatch` (update). In update mode empty cells are omitted so
 * they keep the listing's current value.
 */
export function csvRowToListingBody(row: ListingCsvRow): Record<string, unknown> {
  const mode = csvRowMode(row);
  const body: Record<string, unknown> = {};
  const include = (value: string) => mode === "create" || value !== "";

  for (const key of STRING_KEYS) {
    if (row[key] && include(row[key])) body[key] = row[key];
  }
  for (const key of NUMBER_KEYS) {
    if (row[key] && include(row[key])) body[key] = Number(row[key]);
  }
  if (row.furnished) body.furnished = row.furnished === "true";
  if (row.amenities) body.amenities = splitList(row.amenities);

  if (row.country || row.state || row.streetAddress) {
    body.address = {
      country: row.country,
      state: row.state,
      city: row.city,
      address: row.streetAddress,
      formatted: [row.streetAddress, row.city, row.state, row.country]
        .filter(Boolean)
        .join(", "),
    };
  }

  const gallery = splitList(row.galleryImages);
  if (row.primaryImage && !gallery.includes(row.primaryImage) && gallery.length > 0) {
    gallery.unshift(row.primaryImage);
  }
  if (gallery.length > 0) {
    body.gallery = gallery.map((url) => ({ url }));
    body.primaryImage = row.primaryImage || gallery[0];
  } else if (row.primaryImage) {
    body.primaryImage = row.primaryImage;
    if (mode === "create") body.gallery = [{ url: row.primaryImage }];
  }

  const panoramas = splitList(row.panoramaImages);
  if (panoramas.length > 0) {
    body.panoramaImages = panoramas.map((url) => ({ url }));
    body.panoramaImage = panoramas[0];
  }

  return body;
}

/** Cross-field rules on the final (merged) record that is about to be saved. */
export function validateMergedListing(listing: Partial<ListingInput>): string[] {
  const errors: string[] = [];
  if (
    (listing.transactionType === "rent" || listing.transactionType === "lease") &&
    !listing.rentalFrequency
  ) {
    errors.push("Rental frequency is required for rent and lease listings.");
  }
  if ((listing.latitude === undefined) !== (listing.longitude === undefined)) {
    errors.push("Latitude and longitude must be provided together.");
  }
  if ((listing.gallery?.length ?? 0) > LISTING_CSV_MAX_GALLERY) {
    errors.push(`A listing can have at most ${LISTING_CSV_MAX_GALLERY} gallery images.`);
  }
  if ((listing.panoramaImages?.length ?? 0) > LISTING_CSV_MAX_PANORAMAS) {
    errors.push(`A listing can have at most ${LISTING_CSV_MAX_PANORAMAS} panorama images.`);
  }
  if (listing.title && listing.title.length > 200) {
    errors.push("Title must be at most 200 characters.");
  }
  return errors;
}

function formatDate(value: Date | string | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function text(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

export function listingToCsvRow(listing: Listing): ListingCsvRow {
  const gallery = (listing.gallery ?? []).map((image) => image.url);
  return {
    id: listing._id,
    lastUpdated: listing._updatedDate ? new Date(listing._updatedDate).toISOString() : "",
    title: text(listing.title),
    description: text(listing.description),
    transactionType: text(listing.transactionType),
    propertyType: text(listing.propertyType),
    status: text(listing.status),
    price: text(listing.price),
    currency: text(listing.currency),
    area: text(listing.area),
    areaUnit: text(listing.areaUnit),
    bedrooms: text(listing.bedrooms),
    bathrooms: text(listing.bathrooms),
    yearBuilt: text(listing.yearBuilt),
    parkingSpaces: text(listing.parkingSpaces),
    furnished: listing.furnished === undefined ? "" : String(listing.furnished),
    furnishingStatus: text(listing.furnishingStatus),
    propertyCondition: text(listing.propertyCondition),
    tenure: text(listing.tenure),
    rentalFrequency: text(listing.rentalFrequency),
    availabilityDate: formatDate(listing.availabilityDate),
    serviceCharge: text(listing.serviceCharge),
    securityDeposit: text(listing.securityDeposit),
    amenities: (listing.amenities ?? []).join(LISTING_CSV_LIST_SEPARATOR),
    country: text(listing.address?.country),
    state: text(listing.address?.state ?? listing.address?.subdivision),
    city: text(listing.city || listing.address?.city),
    streetAddress: text(listing.address?.address ?? listing.address?.streetAddress),
    latitude: text(listing.latitude),
    longitude: text(listing.longitude),
    agentName: text(listing.agentName),
    agentPhone: text(listing.agentPhone),
    agentEmail: text(listing.agentEmail),
    primaryImage: text(listing.primaryImage),
    galleryImages: gallery.join(LISTING_CSV_LIST_SEPARATOR),
    panoramaImages: getPanoramaImages(listing)
      .map((image) => image.url)
      .join(LISTING_CSV_LIST_SEPARATOR),
  };
}

// Cells a spreadsheet would run as a formula. "+1 512…" phones and "-97.7" stay as-is.
const FORMULA_PREFIX = /^(?:[=@\t\r]|[+-](?![\d\s.]))/;

function escapeCell(value: string): string {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function rowsToCsv(rows: ListingCsvRow[]): string {
  const header = LISTING_CSV_COLUMNS.map((column) => column.key).join(",");
  const lines = rows.map((row) =>
    LISTING_CSV_COLUMNS.map((column) => escapeCell(row[column.key] ?? "")).join(","),
  );
  return `﻿${[header, ...lines].join("\r\n")}\r\n`;
}

export function listingsToCsv(listings: Listing[]): string {
  return rowsToCsv(listings.map(listingToCsvRow));
}

const sampleRow = (values: Partial<ListingCsvRow>): ListingCsvRow => ({
  ...emptyCsvRow(),
  ...values,
});

export const LISTING_CSV_SAMPLE_ROWS: ListingCsvRow[] = [
  sampleRow({
    title: "Modern 3-Bed Family Home",
    description: "Bright detached home with garden, close to schools.",
    transactionType: "sale",
    propertyType: "house",
    status: "active",
    price: "450000",
    currency: "USD",
    area: "2100",
    areaUnit: "sq ft",
    bedrooms: "3",
    bathrooms: "2",
    yearBuilt: "2018",
    parkingSpaces: "2",
    furnished: "false",
    furnishingStatus: "unfurnished",
    propertyCondition: "good",
    tenure: "freehold",
    amenities: "Garden|Garage|Air conditioning",
    country: "United States",
    state: "Texas",
    city: "Austin",
    streetAddress: "1204 Oak Ridge Dr",
    latitude: "30.2672",
    longitude: "-97.7431",
    agentName: "Jane Doe",
    agentPhone: "+1 512 555 0134",
    agentEmail: "jane@agency.com",
    primaryImage: "https://cdn.agency.com/oak-ridge/front.jpg",
    galleryImages:
      "https://cdn.agency.com/oak-ridge/front.jpg|https://cdn.agency.com/oak-ridge/kitchen.jpg|https://cdn.agency.com/oak-ridge/garden.jpg",
    panoramaImages: "https://cdn.agency.com/oak-ridge/living-360.jpg",
  }),
  sampleRow({
    title: "Furnished 2-Bed Apartment, Lekki",
    transactionType: "For rent",
    propertyType: "Apartment",
    status: "Active",
    price: "3500000",
    currency: "NGN",
    area: "120",
    areaUnit: "sq m",
    bedrooms: "2",
    bathrooms: "2",
    yearBuilt: "2021",
    parkingSpaces: "1",
    furnished: "yes",
    furnishingStatus: "furnished",
    propertyCondition: "new",
    tenure: "leasehold",
    rentalFrequency: "yearly",
    availabilityDate: "2026-11-01",
    serviceCharge: "250000",
    securityDeposit: "500000",
    amenities: "Pool|Gym|24h security",
    country: "Nigeria",
    state: "Lagos",
    city: "Lekki",
    streetAddress: "12 Admiralty Way",
    latitude: "6.4474",
    longitude: "3.4553",
    agentName: "John Ade",
    agentPhone: "+234 803 555 0199",
    agentEmail: "john@agency.com",
    galleryImages:
      "https://static.wixstatic.com/media/abc123~mv2.jpg|https://static.wixstatic.com/media/def456~mv2.jpg",
  }),
];

export const LISTING_CSV_TEMPLATE = rowsToCsv(LISTING_CSV_SAMPLE_ROWS);
