import { appInstances } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { resolveBillingAccess } from "../billing-access";

export async function getBillingAccess() {
  let access = resolveBillingAccess();
  try {
    const response = await auth.elevate(appInstances.getAppInstance)();
    access = resolveBillingAccess(response.instance);
  } catch (error) {
    console.error("Unable to resolve app billing entitlement.", error);
  }
  return access;
}

