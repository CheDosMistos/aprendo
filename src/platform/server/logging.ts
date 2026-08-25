import { randomUUID } from 'node:crypto';

const SAFE_TOKEN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const SAFE_ERROR_CODE = /^[A-Z0-9][A-Z0-9_.-]{0,63}$/;

export interface ServerErrorLogInput {
  category?: string;
  endpoint: string;
  operation: string;
  error: unknown;
}

export interface ServerErrorLogRecord {
  level: 'error';
  category: string;
  eventId: string;
  endpoint: string;
  operation: string;
  errorType: string;
  errorCode: string;
}

export function logServerError(input: ServerErrorLogInput): string {
  const eventId = randomUUID();
  const record: ServerErrorLogRecord = {
    level: 'error',
    category: safeToken(input.category, 'api'),
    eventId,
    endpoint: safeEndpoint(input.endpoint),
    operation: safeToken(input.operation, 'unknown'),
    errorType: safeErrorType(input.error),
    errorCode: safeErrorCode(input.error),
  };

  // Deliberately do not serialize Error.message/stack or request/user data.
  console.error(JSON.stringify(record));
  return eventId;
}

function safeErrorType(error: unknown): string {
  if (!(error instanceof Error)) return 'UnknownError';
  return SAFE_TOKEN.test(error.name) ? error.name : 'UnknownError';
}

function safeErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) return 'UNEXPECTED_ERROR';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && SAFE_ERROR_CODE.test(code) ? code : 'UNEXPECTED_ERROR';
}

function safeToken(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && SAFE_TOKEN.test(value) ? value : fallback;
}

function safeEndpoint(value: string): string {
  return /^\/[A-Za-z0-9_./:[\]-]{1,119}$/.test(value) ? value : '/unknown';
}
