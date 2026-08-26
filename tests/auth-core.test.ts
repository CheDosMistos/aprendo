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

test('fresh databases contain no usable bootstrap passwords', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  const auth = new AuthService(database, () => new Date('2026-08-24T08:00:00.000Z'));
  try {
    const rows = database.prepare(`
      SELECT stable_key, username, role, password_hash
      FROM app_users
      WHERE stable_key IN ('default', 'tripo', 'jamono')
      ORDER BY stable_key
    `).all() as Array<{
      stable_key: string;
      username: string;
      role: string;
      password_hash: string | null;
    }>;

    assert.deepEqual(
      rows.map(({ stable_key, username, role, password_hash }) => ({ stable_key, username, role, password_hash })),
      [
        { stable_key: 'default', username: 'mallo', role: 'admin', password_hash: null },
        { stable_key: 'jamono', username: 'Jamoño', role: 'student', password_hash: null },
        { stable_key: 'tripo', username: 'Tripo', role: 'student', password_hash: null },
      ],
    );
    assert.equal(auth.authenticate('mallo', 'anything'), null);
    assert.equal(auth.authenticate('Tripo', 'anything'), null);
  } finally { database.close(); }
});

test('database uniqueness matches the case-insensitive username lookup', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  try {
    assert.throws(() => {
      database.prepare(`
        INSERT INTO app_users (stable_key, display_name, username, role)
        VALUES (?, ?, ?, 'student')
      `).run('case-duplicate', 'Duplicate', 'MALLO');
    }, /UNIQUE constraint failed/);

    const version = database.prepare('SELECT max(version) AS version FROM schema_migrations').get() as { version: number };
    assert.equal(version.version, 9);
  } finally { database.close(); }
});

test('username collation migration fails atomically if an old database already contains a case collision', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  try {
    database.exec('DELETE FROM schema_migrations WHERE version IN (7, 8, 9);');
    database.exec(`
      DROP INDEX idx_app_users_username;
      CREATE UNIQUE INDEX idx_app_users_username
        ON app_users(username) WHERE username IS NOT NULL;
    `);
    database.prepare(`
      INSERT INTO app_users (stable_key, display_name, username, role)
      VALUES (?, ?, ?, 'student')
    `).run('case-duplicate', 'Duplicate', 'MALLO');

    assert.throws(() => applyMigrations(database), /UNIQUE constraint failed/);

    const version7 = database.prepare('SELECT version FROM schema_migrations WHERE version = 7').get();
    assert.equal(version7, undefined);
    const oldIndex = database.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'idx_app_users_username'
    `).get() as { sql: string };
    assert.doesNotMatch(oldIndex.sql, /COLLATE NOCASE/);
    assert.equal((database.prepare('SELECT count(*) AS total FROM app_users WHERE username IN (?, ?)').get('mallo', 'MALLO') as { total: number }).total, 2);
  } finally { database.close(); }
});

test('Unicode letters are valid in editable user logins', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  database.prepare("UPDATE app_users SET password_hash = ? WHERE stable_key = 'jamono'")
    .run(hashPassword('test-password', Buffer.alloc(16, 9)));
  const auth = new AuthService(database, () => new Date('2026-08-24T08:00:00.000Z'));
  try {
    const user = auth.authenticate('Jamoño', 'test-password')!;
    const updated = auth.updateCredentials({
      userId: user.id,
      currentPassword: 'test-password',
      username: 'Jamoño',
      newPassword: 'a-stronger-test-password',
    });
    assert.equal(updated.username, 'Jamoño');
    assert.equal(updated.role, 'student');
    assert.equal(auth.authenticate('Jamoño', 'a-stronger-test-password')?.stableKey, 'jamono');
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

test('existing short passwords remain valid until the user voluntarily changes them', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  const legacyHash = hashPassword('1234', Buffer.alloc(16, 11));
  database.prepare('UPDATE app_users SET password_hash = ? WHERE username = ?').run(legacyHash, 'mallo');
  const auth = new AuthService(database, () => new Date('2026-08-24T08:00:00.000Z'));
  try {
    const user = auth.authenticate('mallo', '1234')!;
    assert.ok(user);

    assert.throws(() => auth.updateCredentials({
      userId: user.id,
      currentPassword: '1234',
      username: 'mallo',
      newPassword: 'abcd',
    }), /15/);
    assert.equal(auth.authenticate('mallo', '1234')?.stableKey, 'default');

    const currentSession = auth.createSession(user.id);
    const otherSession = auth.createSession(user.id);
    const updated = auth.updateCredentials({
      userId: user.id,
      currentPassword: '1234',
      username: 'mallo2',
      newPassword: 'a-stronger-passphrase',
      currentSessionToken: currentSession.token,
    });
    assert.equal(updated.username, 'mallo2');
    assert.equal(auth.authenticate('mallo', '1234'), null);
    assert.equal(auth.authenticate('mallo2', 'a-stronger-passphrase')?.role, 'admin');
    assert.ok(auth.resolveSession(currentSession.token));
    assert.equal(auth.resolveSession(otherSession.token), null);
  } finally { database.close(); }
});

test('reapplying migrations never rewrites an existing password hash', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  const legacyHash = hashPassword('old', Buffer.alloc(16, 12));
  database.prepare('UPDATE app_users SET password_hash = ? WHERE username = ?').run(legacyHash, 'mallo');
  try {
    applyMigrations(database);
    const row = database.prepare('SELECT password_hash FROM app_users WHERE username = ?').get('mallo') as { password_hash: string };
    assert.equal(row.password_hash, legacyHash);
    assert.equal(verifyPassword('old', row.password_hash), true);
  } finally { database.close(); }
});

test('historical default admin with a missing hash is recovered to the intended legacy credential once', () => {
  const database = openDatabase({ path: ':memory:' });
  applyMigrations(database);
  try {
    database.exec('DELETE FROM schema_migrations WHERE version IN (8, 9);');
    database.prepare(`
      UPDATE app_users
      SET password_hash = NULL, created_at = ?
      WHERE stable_key = 'default'
    `).run('2026-08-21T08:00:00.000Z');

    applyMigrations(database);

    const row = database.prepare(`
      SELECT password_hash FROM app_users WHERE stable_key = 'default'
    `).get() as { password_hash: string | null };
    assert.match(row.password_hash ?? '', /^scrypt\$16384\$8\$1\$/);
    assert.equal(verifyPassword('1234', row.password_hash ?? ''), true);
    const version9 = database.prepare('SELECT version FROM schema_migrations WHERE version = 9').get();
    assert.ok(version9);
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
