import type { APIRoute } from 'astro';
import { isKnownCourse } from '@courses/courseRegistry';
import { ApiRequestError, apiErrorResponse, jsonResponse } from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';

export const prerender = false;

export const GET: APIRoute = ({ params, url }) => {
  try {
    const courseId = params.courseId;
    if (!courseId || !isKnownCourse(courseId)) {
      throw new ApiRequestError('Unknown course.', 404);
    }

    const limit = parseLimit(url.searchParams.get('limit'));
    const { progress } = getRuntime();

    return jsonResponse({
      summary: progress.summarize(courseId),
      recent: progress.listRecent(courseId, limit),
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      console.error('[api/progress] progress read failed');
    }
    return apiErrorResponse(error);
  }
};

function parseLimit(value: string | null): number {
  if (value === null) return 20;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new ApiRequestError('limit must be an integer between 1 and 50.');
  }

  return parsed;
}
