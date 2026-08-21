export type PracticeResult = 'ok' | 'partial' | 'repeat';
export type HealthSignal = 'none' | 'discomfort' | 'stop_signal';
export type NextAction = 'continue' | 'continue_review' | 'repeat' | 'stop';

export interface RecordExecutionInput {
  courseId: string;
  contentId: string;
  result: PracticeResult;
  health: HealthSignal;
  durationMinutes?: number;
  problem?: string;
  note?: string;
}

export interface PracticeExecution {
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

export interface CourseProgressSummary {
  courseId: string;
  executionCount: number;
  completedContentIds: string[];
  lastExecution: PracticeExecution | null;
}
