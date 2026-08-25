import type { APIRoute } from 'astro';
import { isKnownCourse, validateCourseSkill } from '@courses/courseRegistry';
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  jsonResponse,
  readJsonBody,
} from '@platform/server/http';
import { logServerError } from '@platform/server/logging';
import { getRuntime } from '@platform/server/runtime';
import { SkillEvidenceValidationError, type SkillType } from '@platform/progress/skillEvidence';

export const prerender = false;

export const GET: APIRoute = ({ url, locals }) => {
  try {
    if (!locals.user) throw new ApiRequestError('Authentication required.', 401);
    const courseId = url.searchParams.get('courseId');
    if (!courseId || !isKnownCourse(courseId)) throw new ApiRequestError('Unknown course.', 404);
    const rawType = url.searchParams.get('skillType');
    const skillType = rawType === null ? undefined : parseSkillType(rawType);
    return jsonResponse({ states: getRuntime().skillsFor(locals.user.stableKey).listStates(courseId, skillType) });
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      logServerError({ endpoint: '/api/progress/skills', operation: 'read', error });
    }
    return apiErrorResponse(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    assertSameOrigin(request);
    if (!locals.user) throw new ApiRequestError('Authentication required.', 401);
    const body = await readJsonBody(request);
    assertKnownCourseSkill(body);
    const state = getRuntime().skillsFor(locals.user.stableKey).record(body);
    return jsonResponse({ state }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) return apiErrorResponse(error);
    if (error instanceof SkillEvidenceValidationError) return jsonResponse({ error: error.message }, 400);
    logServerError({ endpoint: '/api/progress/skills', operation: 'write', error });
    return apiErrorResponse(error);
  }
};

function parseSkillType(value: string): SkillType {
  if (value === 'rudiment' || value === 'competency') return value;
  throw new ApiRequestError('Invalid skillType.');
}

function assertKnownCourseSkill(value: unknown): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ApiRequestError('Invalid skill evidence.');
  const input = value as Record<string, unknown>;
  if (typeof input.courseId !== 'string') throw new ApiRequestError('Unknown course.', 404);
  if (typeof input.skillType !== 'string') throw new ApiRequestError('Invalid skillType.');
  if (typeof input.skillId !== 'string') throw new ApiRequestError('Invalid skillId.', 422);

  const validation = validateCourseSkill(input.courseId, input.skillType, input.skillId);
  if (!validation.valid) {
    throw new ApiRequestError(validation.message ?? 'Invalid course skill.', validation.status ?? 400);
  }
}
