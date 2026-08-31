import { appInstances, embeddedScripts } from "@wix/app-management";
import { recordAppLifecycleEvent } from "../../../../lib/server/app-lifecycle-events";

const SAVED_PROPERTIES_SCRIPT_ID = "97745c0f-9118-4f67-8a30-7193764f470c";

export default appInstances.onAppInstanceInstalled(async (event) => {
  await recordAppLifecycleEvent("AppInstalled", event);
  await embeddedScripts.embedScript(
    { disabled: false },
    { componentId: SAVED_PROPERTIES_SCRIPT_ID },
  );
});
