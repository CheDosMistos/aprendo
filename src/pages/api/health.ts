import type { APIRoute } from 'astro';
import { apiErrorResponse, jsonResponse } from '@platform/server/http';
import { logServerError } from '@platform/server/logging';
import { getRuntimeHealth } from '@platform/server/runtime';

export const prerender = false;

export const GET: APIRoute = () => {
  try {
    return jsonResponse(getRuntimeHealth());
  } catch (error) {
    logServerError({ endpoint: '/api/health', operation: 'read', error });
    return apiErrorResponse(error);
  }
};
