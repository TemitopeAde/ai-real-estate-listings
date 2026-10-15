import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { buildLifecycleSheetRecord, type AppLifecycleEvent } from './lifecycle-sheet-record';
import { getLifecycleSheetsConfig, deliverLifecycleSheetRecord } from './lifecycle-sheet-delivery';
import { readLifecycleSheetsEnv } from './lifecycle-env-bridge';

export async function recordLifecycleEvent(eventType: string, event: AppLifecycleEvent) {
  const config = await getLifecycleSheetsConfig(async () => readLifecycleSheetsEnv());

  let snapshot: unknown = null;
  try {
    const response = await auth.elevate(appInstances.getAppInstance)();
    if (event.metadata?.instanceId && response.instance?.instanceId !== event.metadata.instanceId) {
      throw new Error('Event instance does not match the current app instance.');
    }
    snapshot = response;
  } catch {
    // Removal events can arrive after API access is revoked. Preserve their
    // original payload even when site and billing enrichment is unavailable.
    console.warn('Lifecycle event instance details are unavailable.');
  }

  const record = await buildLifecycleSheetRecord(eventType, event, snapshot);
  await deliverLifecycleSheetRecord(config, record);
}
