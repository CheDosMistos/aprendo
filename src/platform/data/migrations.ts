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
