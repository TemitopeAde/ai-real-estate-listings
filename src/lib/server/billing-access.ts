import { appInstances } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { resolveBillingAccess } from "../billing-access";

const FULL_ACCESS_EMAIL_DOMAIN = "@wix.com";

function hasFullAccessOwner(site: unknown): boolean {
  const ownerInfo = site && typeof site === "object" ? (site as { ownerInfo?: { email?: unknown } }).ownerInfo : undefined;
  const email = typeof ownerInfo?.email === "string" ? ownerInfo.email.trim().toLowerCase() : "";
  return email.endsWith(FULL_ACCESS_EMAIL_DOMAIN);
}

export async function getBillingAccess() {
  let access = resolveBillingAccess();
  try {
    const response = await auth.elevate(appInstances.getAppInstance)();
    access = resolveBillingAccess(response.instance);
    // Sites owned by Wix staff (e.g. App Market reviewers) get every Business feature.
    if (hasFullAccessOwner(response.site)) {
      access = { ...access, planId: "business", accessStatus: "paid", hasAccess: true, canStartTrial: false };
    }
  } catch (error) {
    console.error("Unable to resolve app billing entitlement.", error);
  }
  return access;
}
