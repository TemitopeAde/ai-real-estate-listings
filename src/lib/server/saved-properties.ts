import { items } from '@wix/data';
import { auth } from '@wix/essentials';

import { getListing, getPublicListing } from '@/lib/server/listings';
import { SAVED_PROPERTIES_COLLECTION_ID, type Listing } from '@/lib/listing-types';

type SavedRecord = { _id?: string; memberId?: string; listingId?: string; savedAt?: Date | string };

export interface SavedPropertySummary {
  id: string;
  savedPropertyId: string;
  savedAt: string;
  available: boolean;
  property?: Pick<Listing, '_id' | 'title' | 'price' | 'currency' | 'city' | 'primaryImage' | 'gallery' | 'status'>;
}

export interface SavedPropertiesPage {
  items: SavedPropertySummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

function record(value: unknown): SavedRecord {
  return typeof value === 'object' && value !== null ? value as SavedRecord : {};
}

function encodeCursor(offset: number): string {
  return `saved-properties-${offset}`;
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const parsed = Number(cursor.replace(/^saved-properties-/, ''));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export async function getCurrentMemberId(): Promise<string | null> {
  try {
    const token = await auth.getTokenInfo();
    return token.active && token.subjectType === 'MEMBER' && token.subjectId ? token.subjectId : null;
  } catch (error) {
    console.error('Unable to resolve the current Wix member.', error);
    return null;
  }
}

function summary(saved: SavedRecord, listing: Listing | null): SavedPropertySummary | null {
  if (!saved._id || !saved.listingId) return null;
  const date = saved.savedAt instanceof Date ? saved.savedAt : new Date(saved.savedAt ?? 0);
  return {
    id: saved.listingId,
    savedPropertyId: saved._id,
    savedAt: Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString(),
    available: listing?.status === 'active',
    property: listing ? {
      _id: listing._id,
      title: listing.title,
      price: listing.price,
      currency: listing.currency,
      city: listing.city,
      primaryImage: listing.primaryImage,
      gallery: listing.gallery,
      status: listing.status,
    } : undefined,
  };
}

export async function saveProperty(memberId: string, listingId: string): Promise<{ saved: true; savedPropertyId: string }> {
  const listing = await getPublicListing(listingId);
  if (!listing) throw new Error('Only active properties can be saved.');

  const query = auth.elevate(items.query);
  const existing = await query(SAVED_PROPERTIES_COLLECTION_ID).eq('memberId', memberId).eq('listingId', listingId).limit(1).find();
  const first = record(existing.items[0]);
  if (first._id) return { saved: true, savedPropertyId: first._id };

  try {
    const inserted = await auth.elevate(items.insert)(SAVED_PROPERTIES_COLLECTION_ID, {
      memberId,
      listingId,
      savedAt: new Date(),
    });
    const saved = record(inserted);
    if (!saved._id) throw new Error('The saved property record was not created.');
    return { saved: true, savedPropertyId: saved._id };
  } catch (error) {
    // A concurrent request may have won the unique member/listing index.
    const retry = await query(SAVED_PROPERTIES_COLLECTION_ID).eq('memberId', memberId).eq('listingId', listingId).limit(1).find();
    const saved = record(retry.items[0]);
    if (saved._id) return { saved: true, savedPropertyId: saved._id };
    throw error;
  }
}

export async function listSavedProperties(memberId: string, cursor?: string, requestedLimit = 12): Promise<SavedPropertiesPage> {
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const offset = decodeCursor(cursor);
  const result = await auth.elevate(items.query)(SAVED_PROPERTIES_COLLECTION_ID)
    .eq('memberId', memberId)
    .descending('savedAt')
    .skip(offset)
    .limit(limit + 1)
    .find();
  const records = result.items.map(record);
  const pageRecords = records.slice(0, limit);
  const pageItems = (await Promise.all(pageRecords.map(async (saved) => {
    const listing = saved.listingId ? await getListing(saved.listingId) : null;
    return summary(saved, listing);
  }))).filter((value): value is SavedPropertySummary => value !== null);
  const hasNext = records.length > limit;
  return { items: pageItems, hasNext, nextCursor: hasNext ? encodeCursor(offset + limit) : null };
}

export async function removeSavedProperty(memberId: string, listingId: string): Promise<{ removed: boolean }> {
  const result = await auth.elevate(items.query)(SAVED_PROPERTIES_COLLECTION_ID)
    .eq('memberId', memberId).eq('listingId', listingId).limit(1).find();
  const saved = record(result.items[0]);
  if (!saved._id || saved.memberId !== memberId) return { removed: false };
  await auth.elevate(items.remove)(SAVED_PROPERTIES_COLLECTION_ID, saved._id);
  return { removed: true };
}
