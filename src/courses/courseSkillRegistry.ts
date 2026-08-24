import { COMPETENCY_ID_PATTERN, PAS_RUDIMENT_SET } from './bateria/curriculum.ts';

export interface CourseSkillValidation {
  valid: boolean;
  status?: number;
  message?: string;
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
