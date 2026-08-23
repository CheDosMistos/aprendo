import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '@platform/data/database';
import { applyMigrations, latestSchemaVersion } from '@platform/data/migrations';
import { ProgressService } from '@platform/progress/progressService';
import { SkillEvidenceService } from '@platform/progress/skillEvidence';

interface RuntimeState {
  database: DatabaseSync;
  progress: ProgressService;
  skills: SkillEvidenceService;
}

let runtime: RuntimeState | undefined;

export function getRuntime(): RuntimeState {
  if (runtime) return runtime;

  const database = openDatabase();

  try {
    applyMigrations(database);
    runtime = {
      database,
      progress: new ProgressService(database),
      skills: new SkillEvidenceService(database),
    };
    return runtime;
  } catch (error) {
    database.close();
    throw error;
  }
}

export function getRuntimeHealth(): { status: 'ok'; schemaVersion: number } {
  const { database } = getRuntime();
  database.prepare('SELECT 1').get();

  return {
    status: 'ok',
    schemaVersion: latestSchemaVersion(),
  };
}
