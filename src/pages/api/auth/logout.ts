import type { APIRoute } from 'astro';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@platform/auth/sessionCookie';
import { assertSameOrigin } from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';

export const prerender = false;

export const POST: APIRoute = ({ request, cookies, redirect }) => {
  try {
    assertSameOrigin(request);
    getRuntime().auth.revokeSession(cookies.get(SESSION_COOKIE_NAME)?.value);
  } finally {
    clearSessionCookie(cookies);
  }
  return redirect('/login/', 303);
};
