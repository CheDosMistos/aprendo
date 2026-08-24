import type { APIRoute } from 'astro';
import { setSessionCookie } from '@platform/auth/sessionCookie';
import { assertSameOrigin } from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    assertSameOrigin(request);
    const form = await request.formData();
    const username = form.get('username');
    const password = form.get('password');

    if (typeof username !== 'string' || typeof password !== 'string') {
      return redirect('/login/?error=1', 303);
    }

    const user = getRuntime().auth.authenticate(username, password);
    if (!user) return redirect('/login/?error=1', 303);

    const session = getRuntime().auth.createSession(user.id);
    setSessionCookie(cookies, session.token);
    return redirect('/', 303);
  } catch {
    return redirect('/login/?error=1', 303);
  }
};
