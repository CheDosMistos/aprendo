import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveContinueDestination } from '../src/platform/progress/continueDestination.ts';
import type { CourseProgressSummary, PracticeExecution } from '../src/platform/progress/types.ts';

const items = [
  { contentId: 'bat-f1-u1-s0', route: '/bateria/unidad-1/diagnostico/' },
  { contentId: 'bat-f1-u1-l1', route: '/bateria/unidad-1/leccion-1/' },
  { contentId: 'bat-f1-u1-l2', route: '/bateria/unidad-1/leccion-2/' },
] as const;

function summary(nextAction: PracticeExecution['nextAction'], contentId = 'bat-f1-u1-l1'): CourseProgressSummary {
  return {
    courseId: 'bateria',
    executionCount: 1,
    completedContentIds: nextAction === 'continue' ? [contentId] : [],
    needsReviewContentIds: nextAction === 'continue_review' ? [contentId] : [],
    lastExecution: {
      id: 'execution-1',
      userId: 1,
      courseId: 'bateria',
      contentId,
      result: nextAction === 'repeat' ? 'repeat' : nextAction === 'continue_review' ? 'partial' : 'ok',
      health: nextAction === 'stop' ? 'stop_signal' : 'none',
      nextAction,
      durationMinutes: null,
      limitingVariable: null,
      problem: null,
      note: null,
      completedAt: '2026-08-21T08:00:00.000Z',
    },
  };
}

test('continue destination starts at the first real course content without progress', () => {
  assert.equal(resolveContinueDestination(undefined, items, '/bateria/'), '/bateria/unidad-1/diagnostico/');
});

test('continue and continue_review advance through the curricular order', () => {
  assert.equal(resolveContinueDestination(summary('continue'), items, '/bateria/'), '/bateria/unidad-1/leccion-2/');
  assert.equal(resolveContinueDestination(summary('continue_review'), items, '/bateria/'), '/bateria/unidad-1/leccion-2/');
});

test('repeat returns to the same content and stop falls back to the course entry', () => {
  assert.equal(resolveContinueDestination(summary('repeat'), items, '/bateria/'), '/bateria/unidad-1/leccion-1/');
  assert.equal(resolveContinueDestination(summary('stop'), items, '/bateria/'), '/bateria/');
});

test('unknown historical content degrades to the first unfinished known content', () => {
  const value = summary('continue', 'bat-f1-u0-old');
  value.completedContentIds = ['bat-f1-u1-s0'];
  assert.equal(resolveContinueDestination(value, items, '/bateria/'), '/bateria/unidad-1/leccion-1/');
});
