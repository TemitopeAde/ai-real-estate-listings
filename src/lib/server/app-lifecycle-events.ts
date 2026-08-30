import { appInstances } from "@wix/app-management";
import { getSql } from "./neon";

type AppLifecycleEvent = {
  data?: unknown;
  metadata?: {
    instanceId?: string | null;
    eventType?: string;
    accountInfo?: {
      accountId?: string | null;
      siteId?: string | null;
    };
  };
};

export async function recordAppLifecycleEvent(
  eventType: string,
  event: AppLifecycleEvent,
) {
  const sql = getSql();
  const metadata = event.metadata;
  const data = event.data as
    { operationTimeStamp?: Date | string | null } | undefined;
  const occurredAt = data?.operationTimeStamp ?? null;
  const eventId =
    [eventType, metadata?.instanceId, occurredAt].filter(Boolean).join(":") ||
    crypto.randomUUID();
  let appName: string | null = null;
  let ownerEmail: string | null = null;

  try {
    const appInstance = await appInstances.getAppInstance();
    appName = appInstance.instance?.appName ?? null;
    ownerEmail = appInstance.site?.ownerInfo?.email ?? null;
  } catch (error) {
    console.error("Unable to retrieve app instance details", error);
  }

  await sql`
    INSERT INTO app_lifecycle_events (
      event_id, event_type, app_name, owner_email, instance_id, account_id, site_id,
      occurred_at, payload
    ) VALUES (
      ${eventId}, ${metadata?.eventType ?? eventType},
      ${appName},
      ${ownerEmail},
      ${metadata?.instanceId ?? null}, ${metadata?.accountInfo?.accountId ?? null},
      ${metadata?.accountInfo?.siteId ?? null}, ${occurredAt}, ${JSON.stringify(event)}::jsonb
    )
    ON CONFLICT (event_id) DO NOTHING
  `;
}
