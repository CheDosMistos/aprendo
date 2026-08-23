import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { ExecutionRepository } from './executionRepository.ts';
import type {
  CourseProgressSummary,
  HealthSignal,
  NextAction,
  PracticeExecution,
  PracticeResult,
} from './types.ts';
import { validateRecordExecutionInput } from './validation.ts';

export interface ProgressServiceOptions {
  userStableKey?: string;
  now?: () => Date;
  createId?: () => string;
}

export class ProgressService {
  private readonly repository: ExecutionRepository;
  private readonly userStableKey: string;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(database: DatabaseSync, options: ProgressServiceOptions = {}) {
    this.repository = new ExecutionRepository(database);
    this.userStableKey = options.userStableKey ?? 'default';
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? randomUUID;
  }

  recordExecution(value: unknown): PracticeExecution {
    const input = validateRecordExecutionInput(value);
    const userId = this.repository.getUserId(this.userStableKey);
    const nextAction = deriveNextAction(input.result, input.health);

    return this.repository.insert({
      id: this.createId(),
      userId,
      courseId: input.courseId,
      contentId: input.contentId,
      result: input.result,
      health: input.health,
      nextAction,
      durationMinutes: input.durationMinutes ?? null,
      limitingVariable: input.limitingVariable ?? null,
      problem: input.problem ?? null,
      note: input.note ?? null,
      completedAt: this.now().toISOString(),
    });
  }

  listRecent(courseId: string, limit = 20): PracticeExecution[] {
    const userId = this.repository.getUserId(this.userStableKey);
    return this.repository.listRecent(userId, courseId, limit);
  }

  summarize(courseId: string): CourseProgressSummary {
    const userId = this.repository.getUserId(this.userStableKey);
    return this.repository.summarize(userId, courseId);
  }
}

export function deriveNextAction(result: PracticeResult, health: HealthSignal): NextAction {
  if (health === 'stop_signal') return 'stop';
  if (result === 'repeat') return 'repeat';
  if (health === 'discomfort' || result === 'partial') return 'continue_review';
  return 'continue';
}
