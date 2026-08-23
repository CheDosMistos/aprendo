import assert from 'node:assert/strict';
import test from 'node:test';
import { openDatabase } from '../src/platform/data/database.ts';
import { applyMigrations, latestSchemaVersion } from '../src/platform/data/migrations.ts';
import { deriveNextAction, ProgressService } from '../src/platform/progress/progressService.ts';
import { SkillEvidenceService } from '../src/platform/progress/skillEvidence.ts';
import { ProgressValidationError } from '../src/platform/progress/validation.ts';

function createTestContext() {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  let nextId = 1;
  const service = new ProgressService(database, {
    now: () => new Date('2026-08-21T08:00:00.000Z'),
    createId: () => `execution-${nextId++}`,
  });
  return { database, service };
}

test('migrations are idempotent and seed the internal user', () => {
  const database = openDatabase({ path: ':memory:' });
  try {
    applyMigrations(database); applyMigrations(database);
    const migration = database.prepare('SELECT MAX(version) AS version FROM schema_migrations').get() as { version: number };
    const user = database.prepare("SELECT stable_key FROM app_users WHERE stable_key = 'default'").get() as { stable_key: string } | undefined;
    assert.equal(migration.version, latestSchemaVersion()); assert.equal(user?.stable_key, 'default'); assert.equal(latestSchemaVersion(), 3);
  } finally { database.close(); }
});

test('next action keeps advancement separate from perfection', () => {
  assert.equal(deriveNextAction('ok', 'none'), 'continue');
  assert.equal(deriveNextAction('partial', 'none'), 'continue_review');
  assert.equal(deriveNextAction('repeat', 'none'), 'repeat');
  assert.equal(deriveNextAction('ok', 'discomfort'), 'continue_review');
  assert.equal(deriveNextAction('ok', 'stop_signal'), 'stop');
  assert.equal(deriveNextAction('repeat', 'stop_signal'), 'stop');
});

test('recording an execution appends history and stores structured feedback', () => {
  const { database, service } = createTestContext();
  try {
    const execution = service.recordExecution({
      courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'partial', health: 'none', durationMinutes: 27,
      limitingVariable: 'sound', problem: '  El segundo golpe del double pierde claridad.  ', note: '  ',
    });
    assert.equal(execution.id, 'execution-1'); assert.equal(execution.nextAction, 'continue_review');
    assert.equal(execution.limitingVariable, 'sound');
    assert.equal(execution.problem, 'El segundo golpe del double pierde claridad.'); assert.equal(execution.note, null);
    assert.equal(service.listRecent('bateria').length, 1);
  } finally { database.close(); }
});

test('partial is review state, not completed, and latest execution wins', () => {
  const { database, service } = createTestContext();
  try {
    service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'partial', health: 'none' });
    let summary = service.summarize('bateria'); assert.deepEqual(summary.completedContentIds, []); assert.deepEqual(summary.needsReviewContentIds, ['bat-f1-u1-l1']);
    service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'ok', health: 'none' });
    summary = service.summarize('bateria'); assert.deepEqual(summary.completedContentIds, ['bat-f1-u1-l1']); assert.deepEqual(summary.needsReviewContentIds, []);
    service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'repeat', health: 'none' });
    summary = service.summarize('bateria'); assert.deepEqual(summary.completedContentIds, []); assert.deepEqual(summary.needsReviewContentIds, []);
  } finally { database.close(); }
});

test('health stop signal never marks content as completed', () => {
  const { database, service } = createTestContext();
  try {
    const execution = service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l2', result: 'ok', health: 'stop_signal' });
    assert.equal(execution.nextAction, 'stop'); assert.deepEqual(service.summarize('bateria').completedContentIds, []);
  } finally { database.close(); }
});

test('skill evidence keeps history and current state separate', () => {
  const database = openDatabase({ path: ':memory:' }); applyMigrations(database); let id = 1; let minute = 0;
  const skills = new SkillEvidenceService(database, { createId: () => `evidence-${id++}`, now: () => new Date(`2026-08-21T08:${String(minute++).padStart(2, '0')}:00.000Z`) });
  try {
    let state = skills.record({ courseId: 'bateria', skillType: 'rudiment', skillId: 'Flam', observation: 'unstable', workState: 'stabilizing', retentionState: 'not_checked', limitingVariable: 'movement', corrective: 'Preparar alturas y retestar.' });
    assert.equal(state.workState, 'stabilizing'); assert.equal(state.masteryState, null);
    state = skills.record({ courseId: 'bateria', skillType: 'rudiment', skillId: 'Flam', observation: 'available', masteryState: 'known', retentionState: 'checked' });
    assert.equal(state.masteryState, 'known'); assert.equal(state.retentionState, 'checked'); assert.equal(skills.listStates('bateria', 'rudiment').length, 1);
    const count = database.prepare('SELECT COUNT(*) AS count FROM skill_evidence').get() as { count: number }; assert.equal(count.count, 2);
  } finally { database.close(); }
});

test('invalid structured feedback is rejected before SQLite', () => {
  const { database, service } = createTestContext();
  try {
    assert.throws(() => service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'perfect', health: 'none' }), ProgressValidationError);
    assert.throws(() => service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'ok', health: 'none', durationMinutes: 0 }), ProgressValidationError);
    assert.throws(() => service.recordExecution({ courseId: 'bateria', contentId: 'bat-f1-u1-l1', result: 'ok', health: 'none', limitingVariable: 'speed' }), ProgressValidationError);
  } finally { database.close(); }
});
