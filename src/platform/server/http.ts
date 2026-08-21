const MAX_JSON_BODY_BYTES = 16 * 1024;

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function assertSameOrigin(request: Request): void {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');

  if (origin && origin !== requestOrigin) {
    throw new ApiRequestError('Cross-origin writes are not allowed.', 403);
  }

  const referer = request.headers.get('referer');
  if (!origin && referer && safeOrigin(referer) !== requestOrigin) {
    throw new ApiRequestError('Cross-origin writes are not allowed.', 403);
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new ApiRequestError('Content-Type must be application/json.', 415);
  }

  const declaredLengthHeader = request.headers.get('content-length');
  if (declaredLengthHeader !== null) {
    const declaredLength = Number(declaredLengthHeader);
    if (!Number.isFinite(declaredLength) || declaredLength < 0) {
      throw new ApiRequestError('Invalid Content-Length header.');
    }
    if (declaredLength > MAX_JSON_BODY_BYTES) {
      throw new ApiRequestError('Request body is too large.', 413);
    }
  }

  const text = await readBoundedText(request, MAX_JSON_BODY_BYTES);

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError('Request body must contain valid JSON.');
  }
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  return jsonResponse({ error: 'Internal server error.' }, 500);
}

async function readBoundedText(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel('Request body too large');
        throw new ApiRequestError('Request body is too large.', 413);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
