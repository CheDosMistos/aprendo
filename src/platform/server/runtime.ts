import type { DatabaseSync } from 'node:sqlite';
import { AuthService } from '@platform/auth/authService';
import { openDatabase } from '@platform/data/database';
import { applyMigrations, latestSchemaVersion } from '@platform/data/migrations';
import { ProgressService } from '@platform/progress/progressService';
import { SkillEvidenceService } from '@platform/progress/skillEvidence';

interface RuntimeState {
  database: DatabaseSync;
  auth: AuthService;
  progress: ProgressService;
  skills: SkillEvidenceService;
  progressFor(userStableKey: string): ProgressService;
  skillsFor(userStableKey: string): SkillEvidenceService;
}

let runtime: RuntimeState | undefined;

export function getRuntime(): RuntimeState {
  if (runtime) return runtime;

  const database = openDatabase();

  try {
    applyMigrations(database);
    runtime = {
      database,
      auth: new AuthService(database),
      progress: new ProgressService(database),
      skills: new SkillEvidenceService(database),
      progressFor: (userStableKey) => new ProgressService(database, { userStableKey }),
      skillsFor: (userStableKey) => new SkillEvidenceService(database, { userStableKey }),
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
