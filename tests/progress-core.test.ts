import assert from 'node:assert/strict';
import test from 'node:test';
import { openDatabase } from '../src/platform/data/database.ts';
import { applyMigrations, latestSchemaVersion } from '../src/platform/data/migrations.ts';
import { deriveNextAction, ProgressService } from '../src/platform/progress/progressService.ts';
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
    applyMigrations(database);
    applyMigrations(database);

    const migration = database
      .prepare('SELECT MAX(version) AS version FROM schema_migrations')
      .get() as { version: number };
    const user = database
      .prepare("SELECT stable_key FROM app_users WHERE stable_key = 'default'")
      .get() as { stable_key: string } | undefined;

    assert.equal(migration.version, latestSchemaVersion());
    assert.equal(user?.stable_key, 'default');
  } finally {
    database.close();
  }
});

test('next action keeps advancement separate from perfection', () => {
  assert.equal(deriveNextAction('ok', 'none'), 'continue');
  assert.equal(deriveNextAction('partial', 'none'), 'continue_review');
  assert.equal(deriveNextAction('repeat', 'none'), 'repeat');
  assert.equal(deriveNextAction('ok', 'discomfort'), 'continue_review');
  assert.equal(deriveNextAction('ok', 'stop_signal'), 'stop');
  assert.equal(deriveNextAction('repeat', 'stop_signal'), 'stop');
});

test('recording an execution appends history and normalizes optional text', () => {
  const { database, service } = createTestContext();
  try {
    const execution = service.recordExecution({
      courseId: 'bateria',
      contentId: 'bat-f1-u1-l1',
      result: 'partial',
      health: 'none',
      durationMinutes: 27,
      problem: '  El segundo golpe del double pierde claridad.  ',
      note: '  ',
    });

    assert.equal(execution.id, 'execution-1');
    assert.equal(execution.nextAction, 'continue_review');
    assert.equal(execution.problem, 'El segundo golpe del double pierde claridad.');
    assert.equal(execution.note, null);
    assert.equal(execution.completedAt, '2026-08-21T08:00:00.000Z');

    const recent = service.listRecent('bateria');
    assert.equal(recent.length, 1);
    assert.equal(recent[0]?.contentId, 'bat-f1-u1-l1');
  } finally {
    database.close();
  }
});

test('repeated attempts are independent events and only advanced sessions count as completed', () => {
  const { database, service } = createTestContext();
  try {
    service.recordExecution({
      courseId: 'bateria',
      contentId: 'bat-f1-u1-l1',
      result: 'repeat',
      health: 'none',
    });

    let summary = service.summarize('bateria');
    assert.equal(summary.executionCount, 1);
    assert.deepEqual(summary.completedContentIds, []);

    service.recordExecution({
      courseId: 'bateria',
      contentId: 'bat-f1-u1-l1',
      result: 'partial',
      health: 'none',
    });

    summary = service.summarize('bateria');
    assert.equal(summary.executionCount, 2);
    assert.deepEqual(summary.completedContentIds, ['bat-f1-u1-l1']);
    assert.equal(summary.lastExecution?.id, 'execution-2');
  } finally {
    database.close();
  }
});

test('health stop signal never marks content as completed', () => {
  const { database, service } = createTestContext();
  try {
    const execution = service.recordExecution({
      courseId: 'bateria',
      contentId: 'bat-f1-u1-l2',
      result: 'ok',
      health: 'stop_signal',
    });

    assert.equal(execution.nextAction, 'stop');
    assert.deepEqual(service.summarize('bateria').completedContentIds, []);
  } finally {
    database.close();
  }
});

test('invalid input is rejected before SQLite', () => {
  const { database, service } = createTestContext();
  try {
    assert.throws(
      () => service.recordExecution({
        courseId: 'bateria',
        contentId: 'bat-f1-u1-l1',
        result: 'perfect',
        health: 'none',
      }),
      ProgressValidationError,
    );

    assert.throws(
      () => service.recordExecution({
        courseId: 'bateria',
        contentId: 'bat-f1-u1-l1',
        result: 'ok',
        health: 'none',
        durationMinutes: 0,
      }),
      ProgressValidationError,
    );
  } finally {
    database.close();
  }
});
