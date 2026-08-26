import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { AuthService, hashPassword } from '../src/platform/auth/authService.ts';
import { applyMigrations } from '../src/platform/data/migrations.ts';
import { resetUserPassword } from '../scripts/reset-user-password.ts';

test('password reset replaces an existing credential and revokes all sessions', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-password-reset-'));
  const dbPath = join(root, 'aprendo.sqlite');
  const database = new DatabaseSync(dbPath);
  applyMigrations(database);
  database.prepare("UPDATE app_users SET password_hash = ? WHERE stable_key = 'default'")
    .run(hashPassword('old-password-that-is-long-enough'));
  const auth = new AuthService(database);
  const user = auth.authenticate('mallo', 'old-password-that-is-long-enough')!;
  const session = auth.createSession(user.id);
  database.close();

  resetUserPassword('default', 'new-password-that-is-long-enough', dbPath);

  const verified = new DatabaseSync(dbPath);
  try {
    const nextAuth = new AuthService(verified);
    assert.equal(nextAuth.authenticate('mallo', 'old-password-that-is-long-enough'), null);
    assert.equal(nextAuth.authenticate('mallo', 'new-password-that-is-long-enough')?.stableKey, 'default');
    assert.equal(nextAuth.resolveSession(session.token), null);
  } finally {
    verified.close();
  }
});

test('password reset never creates an unknown user implicitly', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-password-reset-missing-'));
  const dbPath = join(root, 'aprendo.sqlite');
  const database = new DatabaseSync(dbPath);
  applyMigrations(database);
  database.close();

  assert.throws(
    () => resetUserPassword('missing-user', 'new-password-that-is-long-enough', dbPath),
    /No existe ningún usuario/,
  );
});
