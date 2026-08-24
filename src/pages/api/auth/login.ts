import type { APIRoute } from 'astro';
import { loginClientSource } from '@platform/auth/loginRateLimiter';
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

    const runtime = getRuntime();
    const rateInput = { source: loginClientSource(request), username };
    const beforeAttempt = runtime.loginRateLimiter.check(rateInput);
    if (!beforeAttempt.allowed) return rateLimitedResponse(beforeAttempt.retryAfterSeconds);

    const user = runtime.auth.authenticate(username, password);
    if (!user) {
      const afterFailure = runtime.loginRateLimiter.recordFailure(rateInput);
      if (!afterFailure.allowed) return rateLimitedResponse(afterFailure.retryAfterSeconds);
      return redirect('/login/?error=1', 303);
    }

    runtime.loginRateLimiter.recordSuccess(rateInput);
    const session = runtime.auth.createSession(user.id);
    setSessionCookie(cookies, session.token);
    return redirect('/', 303);
  } catch {
    return redirect('/login/?error=1', 303);
  }
};

function rateLimitedResponse(retryAfterSeconds: number): Response {
  return new Response('Demasiados intentos de acceso. Inténtalo de nuevo más tarde.', {
    status: 429,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': String(retryAfterSeconds),
    },
  });
}
