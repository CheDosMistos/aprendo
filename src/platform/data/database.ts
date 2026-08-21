import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const DEFAULT_DATABASE_PATH = '/var/lib/aprendo/aprendo.sqlite';

export interface OpenDatabaseOptions {
  path?: string;
  createParentDirectory?: boolean;
}

export function openDatabase(options: OpenDatabaseOptions = {}): DatabaseSync {
  const path = options.path ?? process.env.APRENDO_DB_PATH ?? DEFAULT_DATABASE_PATH;

  if (path !== ':memory:' && options.createParentDirectory !== false) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o750 });
  }

  const database = new DatabaseSync(path, {
    timeout: 5_000,
    defensive: true,
  });

  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA busy_timeout = 5000;');

  if (path !== ':memory:') {
    database.exec('PRAGMA journal_mode = WAL;');
    database.exec('PRAGMA synchronous = NORMAL;');
  }

  return database;
}
