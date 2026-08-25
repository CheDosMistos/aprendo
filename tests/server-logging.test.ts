import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { logServerError } from '../src/platform/server/logging.ts';

test('structured server error logs contain useful metadata without error messages or stacks', () => {
  const original = console.error;
  const output: string[] = [];
  console.error = (...values: unknown[]) => output.push(values.map(String).join(' '));
  try {
    const error = Object.assign(new Error('secret database detail password=do-not-log'), { code: 'SQLITE_BUSY' });
    const eventId = logServerError({ endpoint: '/api/progress/executions', operation: 'write', error });
    assert.match(eventId, /^[0-9a-f-]{36}$/i);
    assert.equal(output.length, 1);

    const record = JSON.parse(output[0]) as Record<string, unknown>;
    assert.equal(record.level, 'error');
    assert.equal(record.category, 'api');
    assert.equal(record.eventId, eventId);
    assert.equal(record.endpoint, '/api/progress/executions');
    assert.equal(record.operation, 'write');
    assert.equal(record.errorType, 'Error');
    assert.equal(record.errorCode, 'SQLITE_BUSY');
    assert.doesNotMatch(output[0], /secret database detail|password=|stack/i);
  } finally {
    console.error = original;
  }
});

test('structured server error logs sanitize attacker-controlled metadata', () => {
  const original = console.error;
  const output: string[] = [];
  console.error = (...values: unknown[]) => output.push(values.map(String).join(' '));
  try {
    const error = Object.assign(new Error('private'), { name: 'Bad\nName', code: 'bad code with spaces' });
    logServerError({ category: 'bad category', endpoint: '/api/progress?token=secret', operation: 'bad operation', error });
    const record = JSON.parse(output[0]) as Record<string, unknown>;
    assert.equal(record.category, 'api');
    assert.equal(record.endpoint, '/unknown');
    assert.equal(record.operation, 'unknown');
    assert.equal(record.errorType, 'UnknownError');
    assert.equal(record.errorCode, 'UNEXPECTED_ERROR');
    assert.doesNotMatch(output[0], /private|token=secret|bad code with spaces/);
  } finally {
    console.error = original;
  }
});

test('API routes use the structured logger instead of ad-hoc unexpected-error strings', () => {
  const paths = [
    'src/pages/api/health.ts',
    'src/pages/api/auth/login.ts',
    'src/pages/api/account/profile.ts',
    'src/pages/api/account/avatar.ts',
    'src/pages/api/progress/[courseId].ts',
    'src/pages/api/progress/executions.ts',
    'src/pages/api/progress/skills.ts',
  ];
  for (const path of paths) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /console\.error\(/, path);
  }
});
