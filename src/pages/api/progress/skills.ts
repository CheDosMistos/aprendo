import type { APIRoute } from 'astro';
import { COMPETENCY_ID_PATTERN, PAS_RUDIMENT_SET } from '@courses/bateria/curriculum';
import { isKnownCourse } from '@courses/courseRegistry';
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  jsonResponse,
  readJsonBody,
} from '@platform/server/http';
import { getRuntime } from '@platform/server/runtime';
import type { SkillType } from '@platform/progress/skillEvidence';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  try {
    const courseId = url.searchParams.get('courseId');
    if (!courseId || !isKnownCourse(courseId)) throw new ApiRequestError('Unknown course.', 404);
    const rawType = url.searchParams.get('skillType');
    const skillType = rawType === null ? undefined : parseSkillType(rawType);
    return jsonResponse({ states: getRuntime().skills.listStates(courseId, skillType) });
  } catch (error) {
    if (!(error instanceof ApiRequestError)) console.error('[api/progress/skills] read failed');
    return apiErrorResponse(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request);
    validateCourseSkill(body);
    const state = getRuntime().skills.record(body);
    return jsonResponse({ state }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) return apiErrorResponse(error);
    console.error('[api/progress/skills] write failed');
    return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid skill evidence.' }, 400);
  }
};

function parseSkillType(value: string): SkillType {
  if (value === 'rudiment' || value === 'competency') return value;
  throw new ApiRequestError('Invalid skillType.');
}

function validateCourseSkill(value: unknown): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ApiRequestError('Invalid skill evidence.');
  const input = value as Record<string, unknown>;
  if (input.courseId !== 'bateria') throw new ApiRequestError('Unknown course.', 404);
  if (input.skillType === 'rudiment') {
    if (typeof input.skillId !== 'string' || !PAS_RUDIMENT_SET.has(input.skillId)) throw new ApiRequestError('Unknown PAS rudiment.', 422);
    return;
  }
  if (input.skillType === 'competency') {
    if (typeof input.skillId !== 'string' || !COMPETENCY_ID_PATTERN.test(input.skillId)) throw new ApiRequestError('Unknown battery competency.', 422);
    return;
  }
  throw new ApiRequestError('Invalid skillType.');
}
