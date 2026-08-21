import type { APIRoute } from 'astro';
import { apiErrorResponse, jsonResponse } from '@platform/server/http';
import { getRuntimeHealth } from '@platform/server/runtime';

export const prerender = false;

export const GET: APIRoute = () => {
  try {
    return jsonResponse(getRuntimeHealth());
  } catch (error) {
    console.error('[api/health] runtime health check failed');
    return apiErrorResponse(error);
  }
};
