import type { APIRoute } from 'astro';
import { SESSION_COOKIE_NAME } from '@platform/auth/sessionCookie';
import { ApiRequestError, apiErrorResponse, assertSameOrigin, jsonResponse, readJsonBody } from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    assertSameOrigin(request);
    const user = locals.user;
    if (!user) throw new ApiRequestError('Authentication required.', 401);
    const body = await readJsonBody(request) as Record<string, unknown>;
    const username = typeof body.username === 'string' ? body.username : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' && body.newPassword.length > 0 ? body.newPassword : undefined;

    const updated = getRuntime().auth.updateCredentials({
      userId: user.id,
      username,
      currentPassword,
      newPassword,
      currentSessionToken: cookies.get(SESSION_COOKIE_NAME)?.value,
    });
    locals.user = updated;
    return jsonResponse({ user: publicUser(updated) });
  } catch (error) {
    if (error instanceof ApiRequestError) return apiErrorResponse(error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'No se pudo actualizar la cuenta.' }, 400);
  }
};

function publicUser(user: NonNullable<App.Locals['user']>) {
  return {
    username: user.username,
    role: user.role,
    avatarVersion: user.avatarVersion,
  };
}
