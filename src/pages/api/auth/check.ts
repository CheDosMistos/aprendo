import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  if (!locals.user) return new Response(null, { status: 401 });
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
};
