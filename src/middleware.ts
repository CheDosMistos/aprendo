import { defineMiddleware } from 'astro:middleware';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@platform/auth/sessionCookie';
import { getRuntime } from '@platform/server/runtime';

const PUBLIC_EXACT_PATHS = new Set([
  '/login',
  '/login/',
  '/api/auth/login',
  '/api/auth/login/',
  '/api/health',
  '/api/health/',
  '/favicon.ico',
  '/favicon.svg',
  '/robots.txt',
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const sessionToken = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isPublic = PUBLIC_EXACT_PATHS.has(path) || path.startsWith('/_astro/');

  if (isPublic) {
    if ((path === '/login' || path === '/login/') && sessionToken) {
      const user = getRuntime().auth.resolveSession(sessionToken);
      if (user) return context.redirect('/', 303);
      clearSessionCookie(context.cookies);
    }
    return next();
  }

  const user = getRuntime().auth.resolveSession(sessionToken);
  if (!user) {
    if (sessionToken) clearSessionCookie(context.cookies);
    if (path.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }
    return context.redirect('/login/', 303);
  }

  context.locals.user = user;
  return next();
});
