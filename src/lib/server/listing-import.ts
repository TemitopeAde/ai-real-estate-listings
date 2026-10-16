import {
  LISTING_CSV_BATCH_SIZE,
  LISTING_CSV_COLUMNS,
  csvRowMode,
  csvRowToListingBody,
  emptyCsvRow,
  errorCount,
  listingToCsvRow,
  normalizeCsvRow,
  validateCsvRows,
  validateMergedListing,
  type ListingCsvErrors,
  type ListingCsvRow,
} from "../listing-csv";
import type { ListingInput } from "../listing-types";
import { ListingEditError, ListingLimitError, getAppEntitlement } from "./entitlement";
import { parseListingInput, parseListingPatch } from "./listing-validation";
import { getListing, listingToInput, saveListing } from "./listings";

export interface ListingImportRequestRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ListingImportRequest {
  rows: ListingImportRequestRow[];
  dryRun: boolean;
  /** Dry-run only: creates already counted in earlier batches of the same file. */
  createsBefore: number;
}

export type ListingImportStatus =
  | "ready-create"
  | "ready-update"
  | "created"
  | "updated"
  | "error";

export interface ListingImportResult {
  rowNumber: number;
  status: ListingImportStatus;
  id?: string;
  title?: string;
  errors?: ListingCsvErrors;
  message?: string;
  /** Dry-run update rows: the listing's current values, for the before/after summary. */
  current?: ListingCsvRow;
}

const CSV_KEYS = new Set<string>(LISTING_CSV_COLUMNS.map((column) => column.key));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseImportRequest(body: unknown): { value?: ListingImportRequest; error?: string } {
  if (!isRecord(body) || !Array.isArray(body.rows)) {
    return { error: "Send the rows to import as { rows: [...] }." };
  }
  if (body.rows.length === 0) return { error: "There are no rows to import." };
  if (body.rows.length > LISTING_CSV_BATCH_SIZE) {
    return { error: `Send at most ${LISTING_CSV_BATCH_SIZE} rows per request.` };
  }

  const rows: ListingImportRequestRow[] = [];
  for (const row of body.rows) {
    if (!isRecord(row) || !Number.isInteger(row.rowNumber) || !isRecord(row.values)) {
      return { error: "Each row needs a rowNumber and a values object." };
    }
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(row.values)) {
      if (!CSV_KEYS.has(key)) return { error: `Unknown column "${key}".` };
      if (typeof value !== "string") return { error: `Column "${key}" must be text.` };
      if (value.length > 20000) return { error: `Column "${key}" is too long.` };
      values[key] = value;
    }
    rows.push({ rowNumber: row.rowNumber as number, values });
  }

  const createsBefore =
    typeof body.createsBefore === "number" && Number.isInteger(body.createsBefore) && body.createsBefore >= 0
      ? body.createsBefore
      : 0;
  return { value: { rows, dryRun: body.dryRun === true, createsBefore } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The listing could not be saved.";
}

/** The exported "Last updated" is older than the listing's current update time. */
function isStale(lastUpdated: string, current: Date | string | undefined): boolean {
  if (!lastUpdated || !current) return false;
  const exported = Date.parse(lastUpdated);
  const latest = new Date(current).getTime();
  return Number.isFinite(exported) && Number.isFinite(latest) && latest - exported > 1000;
}

/** A primary image given without a gallery is added to the listing's existing gallery. */
function withPrimaryInGallery(
  patch: Partial<ListingInput>,
  existing: ListingInput,
): Partial<ListingInput> {
  if (!patch.primaryImage || patch.gallery) return patch;
  const gallery = existing.gallery ?? [];
  if (gallery.some((image) => image.url === patch.primaryImage)) return patch;
  return { ...patch, gallery: [{ url: patch.primaryImage }, ...gallery] };
}

/**
 * Validates every row (shared CSV rules, the server listing validators and
 * cross-field rules on the merged record) and, unless `dryRun`, saves the
 * rows that pass. Rows are processed in order so the listing cap is exact.
 */
export async function importListingRows(
  request: ListingImportRequest,
): Promise<ListingImportResult[]> {
  const rows = request.rows.map(({ values }) =>
    normalizeCsvRow({ ...emptyCsvRow(), ...values } as ListingCsvRow),
  );
  const { errors: fieldErrors } = validateCsvRows(rows);
  const entitlement = await getAppEntitlement();
  let remainingCreates =
    entitlement.listingCap === null
      ? Number.POSITIVE_INFINITY
      : entitlement.listingCap - entitlement.listingCount - request.createsBefore;
  let capMessage: string | undefined;

  const results: ListingImportResult[] = [];
  for (const [index, row] of rows.entries()) {
    const rowNumber = request.rows[index]!.rowNumber;
    const base = { rowNumber, title: row.title || undefined, id: row.id || undefined };
    const fail = (message: string, errors?: ListingCsvErrors) =>
      results.push({ ...base, status: "error", message, errors });

    const errors = fieldErrors[index]!;
    if (errorCount(errors) > 0) {
      fail(Object.values(errors).join(" "), errors);
      continue;
    }

    const body = csvRowToListingBody(row);
    try {
      if (csvRowMode(row) === "create") {
        const parsed = parseListingInput(body);
        if (!parsed.value) {
          fail(parsed.errors.join(" "));
          continue;
        }
        const merged = validateMergedListing(parsed.value);
        if (merged.length > 0) {
          fail(merged.join(" "));
          continue;
        }
        if (remainingCreates <= 0) {
          capMessage ??= new ListingLimitError(
            entitlement.planId,
            entitlement.listingCap ?? 0,
            entitlement.listingCount,
          ).message;
          fail(capMessage);
          continue;
        }
        remainingCreates -= 1;
        if (request.dryRun) {
          results.push({ ...base, status: "ready-create" });
          continue;
        }
        const saved = await saveListing(parsed.value);
        results.push({ ...base, status: "created", id: saved._id });
        continue;
      }

      if (!entitlement.features.editListings) {
        fail(new ListingEditError(entitlement.planId).message);
        continue;
      }
      const listing = await getListing(row.id);
      if (!listing) {
        fail("No listing has this ID. Clear the ID to create it as a new listing.", {
          id: "No listing has this ID.",
        });
        continue;
      }
      if (isStale(row.lastUpdated, listing._updatedDate)) {
        fail(
          "This listing was changed after the CSV was exported. Export again to get the latest version.",
          { lastUpdated: "Listing changed since export." },
        );
        continue;
      }
      const parsed = parseListingPatch(body);
      if (!parsed.value) {
        fail(parsed.errors.join(" "));
        continue;
      }
      const existing = listingToInput(listing);
      const patch = withPrimaryInGallery(parsed.value, existing);
      const merged = validateMergedListing({ ...existing, ...patch });
      if (merged.length > 0) {
        fail(merged.join(" "));
        continue;
      }
      if (request.dryRun) {
        results.push({
          ...base,
          title: listing.title,
          status: "ready-update",
          current: listingToCsvRow(listing),
        });
        continue;
      }
      // Entitlement and existence were checked above; save the validated merge.
      const updated = await saveListing({ ...existing, ...patch }, row.id, listing._revision);
      results.push({ ...base, status: "updated", id: updated._id, title: updated.title });
    } catch (error) {
      if (error instanceof ListingLimitError) {
        remainingCreates = 0;
        capMessage = error.message;
      }
      if (!(error instanceof ListingLimitError || error instanceof ListingEditError)) {
        console.error(`Unable to import CSV row ${rowNumber}.`, error);
      }
      fail(errorMessage(error));
    }
  }
  return results;
}
