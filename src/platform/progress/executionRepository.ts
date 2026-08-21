import type { DatabaseSync } from 'node:sqlite';
import type {
  CourseProgressSummary,
  HealthSignal,
  NextAction,
  PracticeExecution,
  PracticeResult,
} from './types.ts';

interface ExecutionRow {
  id: string;
  user_id: number;
  course_id: string;
  content_id: string;
  result: PracticeResult;
  health: HealthSignal;
  next_action: NextAction;
  duration_minutes: number | null;
  problem: string | null;
  note: string | null;
  completed_at: string;
}

export interface InsertExecutionRecord {
  id: string;
  userId: number;
  courseId: string;
  contentId: string;
  result: PracticeResult;
  health: HealthSignal;
  nextAction: NextAction;
  durationMinutes: number | null;
  problem: string | null;
  note: string | null;
  completedAt: string;
}

export class ExecutionRepository {
  constructor(private readonly database: DatabaseSync) {}

  getUserId(stableKey: string): number {
    const row = this.database
      .prepare('SELECT id FROM app_users WHERE stable_key = ?')
      .get(stableKey) as { id: number } | undefined;

    if (!row) throw new Error(`Unknown app user: ${stableKey}`);
    return row.id;
  }

  insert(record: InsertExecutionRecord): PracticeExecution {
    this.database.prepare(`
      INSERT INTO practice_executions (
        id,
        user_id,
        course_id,
        content_id,
        result,
        health,
        next_action,
        duration_minutes,
        problem,
        note,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.userId,
      record.courseId,
      record.contentId,
      record.result,
      record.health,
      record.nextAction,
      record.durationMinutes,
      record.problem,
      record.note,
      record.completedAt,
    );

    const row = this.database
      .prepare('SELECT * FROM practice_executions WHERE id = ?')
      .get(record.id) as ExecutionRow | undefined;

    if (!row) throw new Error('Execution was inserted but could not be read back.');
    return mapExecution(row);
  }

  listRecent(userId: number, courseId: string, limit = 20): PracticeExecution[] {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const rows = this.database.prepare(`
      SELECT *
      FROM practice_executions
      WHERE user_id = ? AND course_id = ?
      ORDER BY completed_at DESC, created_at DESC
      LIMIT ?
    `).all(userId, courseId, safeLimit) as unknown as ExecutionRow[];

    return rows.map(mapExecution);
  }

  summarize(userId: number, courseId: string): CourseProgressSummary {
    const recent = this.listRecent(userId, courseId, 1);
    const countRow = this.database.prepare(`
      SELECT COUNT(*) AS execution_count
      FROM practice_executions
      WHERE user_id = ? AND course_id = ?
    `).get(userId, courseId) as { execution_count: number };

    const contentRows = this.database.prepare(`
      SELECT content_id, MAX(completed_at) AS last_completed_at
      FROM practice_executions
      WHERE user_id = ?
        AND course_id = ?
        AND next_action IN ('continue', 'continue_review')
      GROUP BY content_id
      ORDER BY last_completed_at
    `).all(userId, courseId) as Array<{ content_id: string }>;

    return {
      courseId,
      executionCount: countRow.execution_count,
      completedContentIds: contentRows.map((row) => row.content_id),
      lastExecution: recent[0] ?? null,
    };
  }
}

function mapExecution(row: ExecutionRow): PracticeExecution {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    contentId: row.content_id,
    result: row.result,
    health: row.health,
    nextAction: row.next_action,
    durationMinutes: row.duration_minutes,
    problem: row.problem,
    note: row.note,
    completedAt: row.completed_at,
  };
}
