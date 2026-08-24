import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateCourseSkill } from '../src/courses/courseRegistry.ts';

test('course registry owns battery-specific skill validation', () => {
  assert.deepEqual(validateCourseSkill('bateria', 'rudiment', 'Flam'), { valid: true });
  assert.equal(validateCourseSkill('bateria', 'rudiment', 'Not a PAS rudiment').status, 422);
  assert.deepEqual(validateCourseSkill('bateria', 'competency', 'A1'), { valid: true });
  assert.equal(validateCourseSkill('bateria', 'competency', 'Z99').status, 422);
  assert.equal(validateCourseSkill('future-course', 'competency', 'A1').status, 404);
});

test('generic progress API does not import battery implementation modules or hardcode the battery course', () => {
  const source = readFileSync('src/pages/api/progress/skills.ts', 'utf8');
  assert.doesNotMatch(source, /@courses\/bateria\//);
  assert.doesNotMatch(source, /courseId\s*!==\s*['"]bateria['"]/);
  assert.match(source, /validateCourseSkill/);
});
