import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiRequestError,
  assertSameOrigin,
  readJsonBody,
} from '../src/platform/server/http.ts';

test('same-origin write validation rejects foreign origins', () => {
  const valid = new Request('https://aprendo.molacomer.com/api/progress/executions', {
    method: 'POST',
    headers: { origin: 'https://aprendo.molacomer.com' },
  });
  assert.doesNotThrow(() => assertSameOrigin(valid));

  const foreign = new Request('https://aprendo.molacomer.com/api/progress/executions', {
    method: 'POST',
    headers: { origin: 'https://example.com' },
  });
  assert.throws(() => assertSameOrigin(foreign), ApiRequestError);
});

test('JSON body reader accepts valid JSON and rejects other content types', async () => {
  const valid = new Request('https://aprendo.molacomer.com/api/progress/executions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: 'bateria' }),
  });
  assert.deepEqual(await readJsonBody(valid), { courseId: 'bateria' });

  const invalidType = new Request('https://aprendo.molacomer.com/api/progress/executions', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  });
  await assert.rejects(() => readJsonBody(invalidType), ApiRequestError);
});

test('JSON body reader rejects oversized payloads', async () => {
  const request = new Request('https://aprendo.molacomer.com/api/progress/executions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ note: 'x'.repeat(20_000) }),
  });

  await assert.rejects(() => readJsonBody(request), (error: unknown) => {
    return error instanceof ApiRequestError && error.status === 413;
  });
});
