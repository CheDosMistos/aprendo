import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { AuthInputError } from '../src/platform/auth/authService.ts';
import { AvatarValidationError } from '../src/platform/auth/avatarStore.ts';
import { SkillEvidenceValidationError } from '../src/platform/progress/skillEvidence.ts';
import { apiErrorResponse } from '../src/platform/server/http.ts';

test('unexpected API errors never expose their internal message', async () => {
  const response = apiErrorResponse(new Error('sqlite path /private/internal.sqlite'));
  assert.equal(response.status, 500);
  const body = await response.json() as { error: string };
  assert.equal(body.error, 'Internal server error.');
  assert.doesNotMatch(JSON.stringify(body), /internal\.sqlite/);
});

test('expected domain validation failures have explicit error types', () => {
  assert.equal(new AuthInputError('expected').name, 'AuthInputError');
  assert.equal(new AvatarValidationError('expected').name, 'AvatarValidationError');
  assert.equal(new SkillEvidenceValidationError('expected').name, 'SkillEvidenceValidationError');
});

test('account, avatar and skill routes do not serialize arbitrary Error.message values', () => {
  const routes = [
    'src/pages/api/account/profile.ts',
    'src/pages/api/account/avatar.ts',
    'src/pages/api/progress/skills.ts',
  ];

  for (const route of routes) {
    const source = readFileSync(route, 'utf8');
    assert.doesNotMatch(source, /error instanceof Error\s*\?\s*error\.message/);
    assert.match(source, /apiErrorResponse\(error\)/);
  }
});
