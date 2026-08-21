const MAX_JSON_BODY_BYTES = 16 * 1024;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'ApiRequestError';
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
  if (!origin && referer && new URL(referer).origin !== requestOrigin) {
    throw new ApiRequestError('Cross-origin writes are not allowed.', 403);
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new ApiRequestError('Content-Type must be application/json.', 415);
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new ApiRequestError('Request body is too large.', 413);
  }

  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_JSON_BODY_BYTES) {
    throw new ApiRequestError('Request body is too large.', 413);
  }

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
