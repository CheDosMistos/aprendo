import { getBateriaContent } from '@courses/bateria/contentRegistry';
import { COMPETENCY_ID_PATTERN, PAS_RUDIMENT_SET } from '@courses/bateria/curriculum';

export interface TrackableContent {
  courseId: string;
  contentId: string;
  title: string;
}

export interface CourseSkillValidation {
  valid: boolean;
  status?: number;
  message?: string;
}

export function isKnownCourse(courseId: string): boolean {
  return courseId === 'bateria';
}

export function validateCourseSkill(courseId: string, skillType: string, skillId: string): CourseSkillValidation {
  if (courseId !== 'bateria') return { valid: false, status: 404, message: 'Unknown course.' };

  if (skillType === 'rudiment') {
    return PAS_RUDIMENT_SET.has(skillId)
      ? { valid: true }
      : { valid: false, status: 422, message: 'Unknown PAS rudiment.' };
  }

  if (skillType === 'competency') {
    return COMPETENCY_ID_PATTERN.test(skillId)
      ? { valid: true }
      : { valid: false, status: 422, message: 'Unknown battery competency.' };
  }

  return { valid: false, status: 400, message: 'Invalid skillType.' };
}

export async function resolveTrackableContent(
  courseId: string,
  contentId: string,
): Promise<TrackableContent | null> {
  if (courseId !== 'bateria') return null;

  const entries = await getBateriaContent();
  const entry = entries.find((candidate) => candidate.data.contentId === contentId);

  if (!entry || entry.data.kind === 'unit') return null;

  return {
    courseId: entry.data.courseId,
    contentId: entry.data.contentId,
    title: entry.data.title,
  };
}
