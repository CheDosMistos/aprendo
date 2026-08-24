import type { DatabaseSync } from 'node:sqlite';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initial_progress_schema',
    sql: `
      CREATE TABLE app_users (
        id INTEGER PRIMARY KEY,
        stable_key TEXT NOT NULL UNIQUE,
        display_name TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ) STRICT;

      CREATE TABLE practice_executions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
        course_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        result TEXT NOT NULL CHECK (result IN ('ok', 'partial', 'repeat')),
        health TEXT NOT NULL CHECK (health IN ('none', 'discomfort', 'stop_signal')),
        next_action TEXT NOT NULL CHECK (next_action IN ('continue', 'continue_review', 'repeat', 'stop')),
        duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 600),
        problem TEXT CHECK (problem IS NULL OR length(problem) <= 500),
        note TEXT CHECK (note IS NULL OR length(note) <= 2000),
        completed_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ) STRICT;

      CREATE INDEX idx_practice_user_course_completed
        ON practice_executions(user_id, course_id, completed_at DESC);

      CREATE INDEX idx_practice_user_content_completed
        ON practice_executions(user_id, content_id, completed_at DESC);

      INSERT INTO app_users (stable_key, display_name)
      VALUES ('default', 'Alumno')
      ON CONFLICT(stable_key) DO NOTHING;
    `,
  },
  {
    version: 2,
    name: 'learning_evidence_and_skill_state',
    sql: `
      CREATE TABLE skill_evidence (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
        course_id TEXT NOT NULL,
        skill_type TEXT NOT NULL CHECK (skill_type IN ('rudiment', 'competency')),
        skill_id TEXT NOT NULL,
        source_content_id TEXT,
        observation TEXT NOT NULL CHECK (observation IN ('available', 'unstable', 'unavailable')),
        work_state TEXT CHECK (work_state IS NULL OR work_state IN ('new', 'stabilizing')),
        mastery_state TEXT CHECK (mastery_state IS NULL OR mastery_state IN ('known', 'functional', 'mastered')),
        retention_state TEXT NOT NULL DEFAULT 'not_checked' CHECK (retention_state IN ('not_checked', 'checked')),
        limiting_variable TEXT CHECK (limiting_variable IS NULL OR limiting_variable IN ('time', 'sound', 'relaxation', 'movement', 'sticking', 'dynamics', 'reading', 'memory', 'understanding', 'other')),
        corrective TEXT CHECK (corrective IS NULL OR length(corrective) <= 1000),
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ) STRICT;

      CREATE INDEX idx_skill_evidence_user_course_skill
        ON skill_evidence(user_id, course_id, skill_type, skill_id, observed_at DESC);

      CREATE TABLE skill_state (
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
        course_id TEXT NOT NULL,
        skill_type TEXT NOT NULL CHECK (skill_type IN ('rudiment', 'competency')),
        skill_id TEXT NOT NULL,
        work_state TEXT CHECK (work_state IS NULL OR work_state IN ('new', 'stabilizing')),
        mastery_state TEXT CHECK (mastery_state IS NULL OR mastery_state IN ('known', 'functional', 'mastered')),
        retention_state TEXT NOT NULL DEFAULT 'not_checked' CHECK (retention_state IN ('not_checked', 'checked')),
        observation TEXT NOT NULL CHECK (observation IN ('available', 'unstable', 'unavailable')),
        limiting_variable TEXT CHECK (limiting_variable IS NULL OR limiting_variable IN ('time', 'sound', 'relaxation', 'movement', 'sticking', 'dynamics', 'reading', 'memory', 'understanding', 'other')),
        corrective TEXT CHECK (corrective IS NULL OR length(corrective) <= 1000),
        last_evidence_id TEXT NOT NULL REFERENCES skill_evidence(id) ON DELETE RESTRICT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, course_id, skill_type, skill_id)
      ) STRICT;
    `,
  },
  {
    version: 3,
    name: 'structured_execution_feedback',
    sql: `
      ALTER TABLE practice_executions ADD COLUMN limiting_variable TEXT
        CHECK (limiting_variable IS NULL OR limiting_variable IN (
          'time', 'sound', 'relaxation', 'movement', 'sticking', 'dynamics',
          'reading', 'memory', 'understanding', 'other'
        ));
    `,
  },
  {
    version: 4,
    name: 'platform_authentication',
    sql: `
      ALTER TABLE app_users ADD COLUMN username TEXT;
      ALTER TABLE app_users ADD COLUMN password_hash TEXT;

      UPDATE app_users
      SET username = CASE WHEN stable_key = 'default' THEN 'admin' ELSE stable_key END
      WHERE username IS NULL;

      UPDATE app_users
      SET password_hash = 'scrypt$16384$8$1$ZyghCEq7VfXvdFwiy7RWXA$RIfEAqEs7h1OKggDwWt-32ZsvykRcifh3n3RUbadOJVnIA0svMeKRjUfLzb15Z_1m6QOBxi_QBllncvdUAPs1w'
      WHERE stable_key = 'default' AND password_hash IS NULL;

      CREATE UNIQUE INDEX idx_app_users_username
        ON app_users(username) WHERE username IS NOT NULL;

      CREATE TABLE auth_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX idx_auth_sessions_token_hash
        ON auth_sessions(token_hash);
      CREATE INDEX idx_auth_sessions_user_expires
        ON auth_sessions(user_id, expires_at);
    `,
  },
];

export function applyMigrations(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ) STRICT;
  `);

  const appliedRows = database
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as Array<{ version: number }>;
  const applied = new Set(appliedRows.map((row) => row.version));
  const recordMigration = database.prepare(
    'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
  );

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    database.exec('BEGIN IMMEDIATE;');
    try {
      database.exec(migration.sql);
      recordMigration.run(migration.version, migration.name);
      database.exec('COMMIT;');
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  }
}

export function latestSchemaVersion(): number {
  return migrations.at(-1)?.version ?? 0;
}
