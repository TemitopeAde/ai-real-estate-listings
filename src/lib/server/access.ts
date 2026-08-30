import { auth } from '@wix/essentials';

export async function requireDashboardAccess(): Promise<Response | null> {
  try {
    const tokenInfo = await auth.getTokenInfo();
    const allowed = tokenInfo.active && (tokenInfo.subjectType === 'USER' || tokenInfo.subjectType === 'APP');

    return allowed
      ? null
      : new Response(JSON.stringify({ message: 'Dashboard authentication is required.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
  } catch (error) {
    console.error('Unable to validate dashboard access.', error);
    return new Response(JSON.stringify({ message: 'Dashboard authentication could not be verified.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
