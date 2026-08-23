import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export type SkillType = 'rudiment' | 'competency';
export type SkillObservation = 'available' | 'unstable' | 'unavailable';
export type WorkState = 'new' | 'stabilizing';
export type MasteryState = 'known' | 'functional' | 'mastered';
export type RetentionState = 'not_checked' | 'checked';
export type LimitingVariable = 'time' | 'sound' | 'relaxation' | 'movement' | 'sticking' | 'dynamics' | 'reading' | 'memory' | 'understanding' | 'other';

export interface RecordSkillEvidenceInput {
  courseId: string;
  skillType: SkillType;
  skillId: string;
  sourceContentId?: string;
  observation: SkillObservation;
  workState?: WorkState;
  masteryState?: MasteryState;
  retentionState?: RetentionState;
  limitingVariable?: LimitingVariable;
  corrective?: string;
}

export interface SkillState {
  courseId: string;
  skillType: SkillType;
  skillId: string;
  observation: SkillObservation;
  workState: WorkState | null;
  masteryState: MasteryState | null;
  retentionState: RetentionState;
  limitingVariable: LimitingVariable | null;
  corrective: string | null;
  updatedAt: string;
}

interface SkillStateRow {
  course_id: string;
  skill_type: SkillType;
  skill_id: string;
  observation: SkillObservation;
  work_state: WorkState | null;
  mastery_state: MasteryState | null;
  retention_state: RetentionState;
  limiting_variable: LimitingVariable | null;
  corrective: string | null;
  updated_at: string;
}

export class SkillEvidenceService {
  private readonly database: DatabaseSync;
  private readonly userStableKey: string;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(database: DatabaseSync, options: { userStableKey?: string; now?: () => Date; createId?: () => string } = {}) {
    this.database = database;
    this.userStableKey = options.userStableKey ?? 'default';
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? randomUUID;
  }

  record(value: unknown): SkillState {
    const input = validateSkillEvidence(value);
    const user = this.database.prepare('SELECT id FROM app_users WHERE stable_key = ?').get(this.userStableKey) as { id: number } | undefined;
    if (!user) throw new Error(`Unknown app user: ${this.userStableKey}`);

    const id = this.createId();
    const observedAt = this.now().toISOString();
    const retentionState = input.retentionState ?? 'not_checked';
    const corrective = input.corrective ?? null;
    const limitingVariable = input.limitingVariable ?? null;
    const workState = input.workState ?? null;
    const masteryState = input.masteryState ?? null;
    const sourceContentId = input.sourceContentId ?? null;

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.prepare(`
        INSERT INTO skill_evidence (
          id, user_id, course_id, skill_type, skill_id, source_content_id,
          observation, work_state, mastery_state, retention_state,
          limiting_variable, corrective, observed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, user.id, input.courseId, input.skillType, input.skillId, sourceContentId,
        input.observation, workState, masteryState, retentionState,
        limitingVariable, corrective, observedAt,
      );

      this.database.prepare(`
        INSERT INTO skill_state (
          user_id, course_id, skill_type, skill_id, work_state, mastery_state,
          retention_state, observation, limiting_variable, corrective,
          last_evidence_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, course_id, skill_type, skill_id) DO UPDATE SET
          work_state = excluded.work_state,
          mastery_state = excluded.mastery_state,
          retention_state = excluded.retention_state,
          observation = excluded.observation,
          limiting_variable = excluded.limiting_variable,
          corrective = excluded.corrective,
          last_evidence_id = excluded.last_evidence_id,
          updated_at = excluded.updated_at
      `).run(
        user.id, input.courseId, input.skillType, input.skillId, workState, masteryState,
        retentionState, input.observation, limitingVariable, corrective, id, observedAt,
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return this.getState(input.courseId, input.skillType, input.skillId) as SkillState;
  }

  listStates(courseId: string, skillType?: SkillType): SkillState[] {
    const user = this.database.prepare('SELECT id FROM app_users WHERE stable_key = ?').get(this.userStableKey) as { id: number } | undefined;
    if (!user) throw new Error(`Unknown app user: ${this.userStableKey}`);
    const rows = skillType
      ? this.database.prepare('SELECT * FROM skill_state WHERE user_id = ? AND course_id = ? AND skill_type = ? ORDER BY skill_id').all(user.id, courseId, skillType)
      : this.database.prepare('SELECT * FROM skill_state WHERE user_id = ? AND course_id = ? ORDER BY skill_type, skill_id').all(user.id, courseId);
    return (rows as unknown as SkillStateRow[]).map(mapState);
  }

  private getState(courseId: string, skillType: SkillType, skillId: string): SkillState | null {
    const user = this.database.prepare('SELECT id FROM app_users WHERE stable_key = ?').get(this.userStableKey) as { id: number } | undefined;
    if (!user) return null;
    const row = this.database.prepare(`
      SELECT * FROM skill_state
      WHERE user_id = ? AND course_id = ? AND skill_type = ? AND skill_id = ?
    `).get(user.id, courseId, skillType, skillId) as SkillStateRow | undefined;
    return row ? mapState(row) : null;
  }
}

export function validateSkillEvidence(value: unknown): RecordSkillEvidenceInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Skill evidence payload must be an object.');
  const input = value as Record<string, unknown>;
  const required = (key: string, pattern = /^[a-zA-Z0-9][a-zA-Z0-9 ()#./_-]{0,119}$/) => {
    const candidate = input[key];
    if (typeof candidate !== 'string' || !pattern.test(candidate.trim())) throw new Error(`Invalid ${key}.`);
    return candidate.trim();
  };
  const enumValue = <T extends string>(key: string, allowed: readonly T[], optional = false): T | undefined => {
    const candidate = input[key];
    if (optional && (candidate === undefined || candidate === null || candidate === '')) return undefined;
    if (typeof candidate !== 'string' || !allowed.includes(candidate as T)) throw new Error(`Invalid ${key}.`);
    return candidate as T;
  };
  const correctiveRaw = input.corrective;
  const corrective = correctiveRaw === undefined || correctiveRaw === null || correctiveRaw === ''
    ? undefined
    : typeof correctiveRaw === 'string' && correctiveRaw.trim().length <= 1000
      ? correctiveRaw.trim()
      : (() => { throw new Error('Invalid corrective.'); })();

  return {
    courseId: required('courseId', /^[a-z][a-z0-9-]{0,79}$/),
    skillType: enumValue('skillType', ['rudiment', 'competency'] as const) as SkillType,
    skillId: required('skillId'),
    sourceContentId: input.sourceContentId ? required('sourceContentId', /^[a-z][a-z0-9-]{0,79}$/) : undefined,
    observation: enumValue('observation', ['available', 'unstable', 'unavailable'] as const) as SkillObservation,
    workState: enumValue('workState', ['new', 'stabilizing'] as const, true),
    masteryState: enumValue('masteryState', ['known', 'functional', 'mastered'] as const, true),
    retentionState: enumValue('retentionState', ['not_checked', 'checked'] as const, true),
    limitingVariable: enumValue('limitingVariable', ['time', 'sound', 'relaxation', 'movement', 'sticking', 'dynamics', 'reading', 'memory', 'understanding', 'other'] as const, true),
    corrective,
  };
}

function mapState(row: SkillStateRow): SkillState {
  return {
    courseId: row.course_id,
    skillType: row.skill_type,
    skillId: row.skill_id,
    observation: row.observation,
    workState: row.work_state,
    masteryState: row.mastery_state,
    retentionState: row.retention_state,
    limitingVariable: row.limiting_variable,
    corrective: row.corrective,
    updatedAt: row.updated_at,
  };
}
