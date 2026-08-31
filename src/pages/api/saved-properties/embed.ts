import type { APIRoute } from 'astro';
import { embeddedScripts } from '@wix/app-management';
import { requireDashboardAccess } from '@/lib/server/access';

const SCRIPT_ID = '97745c0f-9118-4f67-8a30-7193764f470c';

export const POST: APIRoute = async () => {
  const denied = await requireDashboardAccess();
  if (denied) return denied;
  try {
    await embeddedScripts.embedScript({ disabled: false }, { componentId: SCRIPT_ID });
    return new Response(JSON.stringify({ embedded: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Unable to embed saved-properties launcher.', error);
    return new Response(JSON.stringify({ message: 'The saved-properties launcher could not be embedded.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
