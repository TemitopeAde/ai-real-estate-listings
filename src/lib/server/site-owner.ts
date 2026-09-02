import { appInstances } from "@wix/app-management";
import { auth } from "@wix/essentials";

import type { Listing } from "@/lib/listing-types";

export interface SiteOwnerContact {
  name?: string;
  email?: string;
  phone?: string;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function joinedName(...parts: (string | undefined)[]): string | undefined {
  const value = parts.filter(Boolean).join(" ").trim();
  return value || undefined;
}

export async function getSiteOwnerContact(): Promise<SiteOwnerContact> {
  try {
    const response = await auth.elevate(appInstances.getAppInstance)();
    const site = record(response.site);
    const ownerInfo = record(site?.ownerInfo);
    return {
      email: text(ownerInfo?.email),
      name:
        text(ownerInfo?.name) ??
        joinedName(text(ownerInfo?.firstName), text(ownerInfo?.lastName)) ??
        text(site?.siteDisplayName),
      phone: text(ownerInfo?.phone) ?? text(ownerInfo?.phoneNumber),
    };
  } catch (error) {
    console.warn("Unable to resolve site owner contact.", error);
    return {};
  }
}

export async function withPublicOwnerContact(listing: Listing): Promise<Listing> {
  if (listing.agentName && listing.agentPhone && listing.agentEmail) {
    return listing;
  }
  const owner = await getSiteOwnerContact();
  return {
    ...listing,
    agentName: listing.agentName || owner.name,
    agentPhone: listing.agentPhone || owner.phone,
    agentEmail: listing.agentEmail || owner.email,
  };
}
