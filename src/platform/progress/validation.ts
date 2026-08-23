import type {
  HealthSignal,
  LimitingVariable,
  PracticeResult,
  RecordExecutionInput,
} from './types.ts';

const practiceResults = new Set<PracticeResult>(['ok', 'partial', 'repeat']);
const healthSignals = new Set<HealthSignal>(['none', 'discomfort', 'stop_signal']);
const limitingVariables = new Set<LimitingVariable>(['time', 'sound', 'relaxation', 'movement', 'sticking', 'dynamics', 'reading', 'memory', 'understanding', 'other']);
const identifierPattern = /^[a-z][a-z0-9-]{0,79}$/;

export class ProgressValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressValidationError';
  }
}

export function validateRecordExecutionInput(value: unknown): RecordExecutionInput {
  if (!isRecord(value)) throw new ProgressValidationError('Execution payload must be an object.');

  const courseId = requiredIdentifier(value.courseId, 'courseId');
  const contentId = requiredIdentifier(value.contentId, 'contentId');

  if (!practiceResults.has(value.result as PracticeResult)) throw new ProgressValidationError('Invalid practice result.');
  if (!healthSignals.has(value.health as HealthSignal)) throw new ProgressValidationError('Invalid health signal.');

  const durationMinutes = optionalDuration(value.durationMinutes);
  const limitingVariable = optionalLimitingVariable(value.limitingVariable);
  const problem = optionalText(value.problem, 500, 'problem');
  const note = optionalText(value.note, 2_000, 'note');

  return {
    courseId,
    contentId,
    result: value.result as PracticeResult,
    health: value.health as HealthSignal,
    ...(durationMinutes === undefined ? {} : { durationMinutes }),
    ...(limitingVariable === undefined ? {} : { limitingVariable }),
    ...(problem === undefined ? {} : { problem }),
    ...(note === undefined ? {} : { note }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredIdentifier(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new ProgressValidationError(`${field} must be a string.`);
  const normalized = value.trim();
  if (!identifierPattern.test(normalized)) throw new ProgressValidationError(`Invalid ${field}.`);
  return normalized;
}

function optionalDuration(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 600) {
    throw new ProgressValidationError('durationMinutes must be an integer between 1 and 600.');
  }
  return value as number;
}

function optionalLimitingVariable(value: unknown): LimitingVariable | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !limitingVariables.has(value as LimitingVariable)) {
    throw new ProgressValidationError('Invalid limitingVariable.');
  }
  return value as LimitingVariable;
}

function optionalText(value: unknown, maxLength: number, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new ProgressValidationError(`${field} must be text.`);
  const normalized = value.trim();
  if (normalized.length === 0) return undefined;
  if (normalized.length > maxLength) throw new ProgressValidationError(`${field} is too long.`);
  return normalized;
}
