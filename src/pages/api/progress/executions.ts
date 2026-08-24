import type { APIRoute } from 'astro';
import { resolveTrackableContent } from '@courses/courseRegistry';
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  jsonResponse,
  readJsonBody,
} from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';
import {
  ProgressValidationError,
  validateRecordExecutionInput,
} from '@platform/progress/validation';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    assertSameOrigin(request);
    if (!locals.user) throw new ApiRequestError('Authentication required.', 401);

    const body = await readJsonBody(request);
    const input = validateRecordExecutionInput(body);
    const content = await resolveTrackableContent(input.courseId, input.contentId);

    if (!content) {
      throw new ApiRequestError('Unknown or non-trackable course content.', 422);
    }

    const execution = getRuntime().progressFor(locals.user.stableKey).recordExecution(input);
    return jsonResponse({ execution }, 201);
  } catch (error) {
    if (error instanceof ProgressValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    if (!(error instanceof ApiRequestError)) {
      console.error('[api/progress/executions] progress write failed');
    }

    return apiErrorResponse(error);
  }
};
