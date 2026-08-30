import { appInstances } from "@wix/app-management";
import { recordAppLifecycleEvent } from "../../../../lib/server/app-lifecycle-events";

export default appInstances.onAppInstanceInstalled((event) =>
  recordAppLifecycleEvent("AppInstalled", event),
);
