import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService, hashPassword, verifyPassword } from '../src/platform/auth/authService.ts';
import { openDatabase } from '../src/platform/data/database.ts';
import { applyMigrations } from '../src/platform/data/migrations.ts';

test('scrypt password hashes verify without storing plaintext', () => {
  const encoded = hashPassword('correct horse battery staple', Buffer.alloc(16, 7));
  assert.match(encoded, /^scrypt\$16384\$8\$1\$/);
  assert.equal(encoded.includes('correct horse battery staple'), false);
  assert.equal(verifyPassword('correct horse battery staple', encoded), true);
  assert.equal(verifyPassword('incorrect', encoded), false);
});

test('seeded administrator authenticates as mallo with the temporary password', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  const auth = new AuthService(database, () => new Date('2026-08-24T08:00:00.000Z'));
  try {
    assert.equal(auth.authenticate('mallo', 'wrong-password'), null);
    const user = auth.authenticate('mallo', '1234');
    assert.equal(user?.stableKey, 'default');
    assert.equal(user?.role, 'admin');
  } finally { database.close(); }
});

test('authentication creates an opaque expiring session for an existing user', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  database.prepare('UPDATE app_users SET password_hash = ? WHERE username = ?')
    .run(hashPassword('test-password', Buffer.alloc(16, 3)), 'mallo');

  const now = new Date('2026-08-24T08:00:00.000Z');
  const auth = new AuthService(database, () => now);

  try {
    assert.equal(auth.authenticate('mallo', 'wrong-password'), null);
    assert.equal(auth.authenticate('missing-user', 'test-password'), null);
    const user = auth.authenticate('mallo', 'test-password');
    assert.equal(user?.stableKey, 'default');

    const session = auth.createSession(user!.id);
    assert.ok(session.token.length >= 32);
    const stored = database.prepare('SELECT token_hash FROM auth_sessions').get() as { token_hash: string };
    assert.notEqual(stored.token_hash, session.token);
    assert.equal(auth.resolveSession(session.token)?.username, 'mallo');

    const expiredAuth = new AuthService(database, () => new Date('2026-08-24T21:00:01.000Z'));
    assert.equal(expiredAuth.resolveSession(session.token), null);
  } finally {
    database.close();
  }
});

test('user can change login and password while keeping the current session', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  const auth = new AuthService(database, () => new Date('2026-08-24T08:00:00.000Z'));
  try {
    const user = auth.authenticate('mallo', '1234')!;
    const currentSession = auth.createSession(user.id);
    const otherSession = auth.createSession(user.id);
    const updated = auth.updateCredentials({
      userId: user.id,
      currentPassword: '1234',
      username: 'mallo2',
      newPassword: 'abcd',
      currentSessionToken: currentSession.token,
    });
    assert.equal(updated.username, 'mallo2');
    assert.equal(auth.authenticate('mallo', '1234'), null);
    assert.equal(auth.authenticate('mallo2', 'abcd')?.role, 'admin');
    assert.ok(auth.resolveSession(currentSession.token));
    assert.equal(auth.resolveSession(otherSession.token), null);
  } finally { database.close(); }
});

test('revoking a session invalidates it immediately', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  database.prepare('UPDATE app_users SET password_hash = ? WHERE username = ?')
    .run(hashPassword('test-password', Buffer.alloc(16, 5)), 'mallo');
  const auth = new AuthService(database, () => new Date('2026-08-24T08:00:00.000Z'));

  try {
    const user = auth.authenticate('mallo', 'test-password');
    const session = auth.createSession(user!.id);
    assert.ok(auth.resolveSession(session.token));
    auth.revokeSession(session.token);
    assert.equal(auth.resolveSession(session.token), null);
  } finally {
    database.close();
  }
});
