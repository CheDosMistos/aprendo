import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;
const DUMMY_PASSWORD_HASH = 'scrypt$16384$8$1$ZyghCEq7VfXvdFwiy7RWXA$RIfEAqEs7h1OKggDwWt-32ZsvykRcifh3n3RUbadOJVnIA0svMeKRjUfLzb15Z_1m6QOBxi_QBllncvdUAPs1w';

export interface AuthUser {
  id: number;
  stableKey: string;
  username: string;
  displayName: string | null;
}

interface UserRow {
  id: number;
  stable_key: string;
  username: string;
  display_name: string | null;
  password_hash: string | null;
}

interface SessionUserRow extends UserRow {
  expires_at: string;
}

export class AuthService {
  private readonly database: DatabaseSync;
  private readonly now: () => Date;

  constructor(database: DatabaseSync, now: () => Date = () => new Date()) {
    this.database = database;
    this.now = now;
  }

  authenticate(username: string, password: string): AuthUser | null {
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password || normalizedUsername.length > 80 || password.length > 512) return null;

    const row = this.database.prepare(`
      SELECT id, stable_key, username, display_name, password_hash
      FROM app_users
      WHERE username = ?
      LIMIT 1
    `).get(normalizedUsername) as UserRow | undefined;

    const valid = verifyPassword(password, row?.password_hash ?? DUMMY_PASSWORD_HASH);
    if (!row?.password_hash || !valid) return null;
    return mapUser(row);
  }

  createSession(userId: number): { token: string; expiresAt: string } {
    this.deleteExpiredSessions();
    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

    this.database.prepare(`
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      randomBytes(16).toString('hex'),
      userId,
      tokenHash,
      expiresAt.toISOString(),
      createdAt.toISOString(),
      createdAt.toISOString(),
    );

    return { token, expiresAt: expiresAt.toISOString() };
  }

  resolveSession(token: string | undefined): AuthUser | null {
    if (!token || token.length > 256) return null;
    const tokenHash = hashToken(token);
    const row = this.database.prepare(`
      SELECT u.id, u.stable_key, u.username, u.display_name, u.password_hash, s.expires_at
      FROM auth_sessions s
      JOIN app_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
      LIMIT 1
    `).get(tokenHash, this.now().toISOString()) as SessionUserRow | undefined;

    if (!row) return null;
    this.database.prepare('UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?')
      .run(this.now().toISOString(), tokenHash);
    return mapUser(row);
  }

  revokeSession(token: string | undefined): void {
    if (!token) return;
    this.database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
  }

  private deleteExpiredSessions(): void {
    this.database.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(this.now().toISOString());
  }
}

export function hashPassword(password: string, salt = randomBytes(16)): string {
  const n = 16_384;
  const r = 8;
  const p = 1;
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, { N: n, r, p });
  return `scrypt$${n}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, nRaw, rRaw, pRaw, saltRaw, expectedRaw] = encoded.split('$');
  if (algorithm !== 'scrypt' || !nRaw || !rRaw || !pRaw || !saltRaw || !expectedRaw) return false;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (n !== 16_384 || r !== 8 || p !== 1) return false;

  try {
    const salt = Buffer.from(saltRaw, 'base64url');
    const expected = Buffer.from(expectedRaw, 'base64url');
    const actual = scryptSync(password, salt, expected.length, { N: n, r, p });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    stableKey: row.stable_key,
    username: row.username,
    displayName: row.display_name,
  };
}
