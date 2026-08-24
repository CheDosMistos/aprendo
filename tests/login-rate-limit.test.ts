import assert from 'node:assert/strict';
import test from 'node:test';
import { LoginRateLimiter, loginClientSource } from '../src/platform/auth/loginRateLimiter.ts';

test('login rate limiter blocks repeated failures for one account and expires cleanly', () => {
  let now = 1_000;
  const limiter = new LoginRateLimiter({
    now: () => now,
    windowMs: 60_000,
    accountLimit: 3,
    sourceLimit: 20,
    accountBlockMs: 120_000,
    sourceBlockMs: 60_000,
  });
  const input = { source: '203.0.113.8', username: 'Alumno' };

  assert.equal(limiter.recordFailure(input).allowed, true);
  assert.equal(limiter.recordFailure(input).allowed, true);
  const blocked = limiter.recordFailure(input);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 120);
  assert.equal(limiter.check({ ...input, username: 'alumno' }).allowed, false);

  now += 120_001;
  assert.equal(limiter.check(input).allowed, true);
});

test('login rate limiter also bounds username spraying from one source', () => {
  const limiter = new LoginRateLimiter({
    now: () => 10_000,
    windowMs: 60_000,
    accountLimit: 5,
    sourceLimit: 3,
    accountBlockMs: 120_000,
    sourceBlockMs: 30_000,
  });

  assert.equal(limiter.recordFailure({ source: '198.51.100.2', username: 'one' }).allowed, true);
  assert.equal(limiter.recordFailure({ source: '198.51.100.2', username: 'two' }).allowed, true);
  const blocked = limiter.recordFailure({ source: '198.51.100.2', username: 'three' });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 30);
  assert.equal(limiter.check({ source: '198.51.100.2', username: 'different' }).allowed, false);
});

test('a successful login clears only the account-specific failure bucket', () => {
  const limiter = new LoginRateLimiter({
    now: () => 5_000,
    accountLimit: 2,
    sourceLimit: 10,
  });
  const input = { source: '192.0.2.4', username: 'mallo' };

  assert.equal(limiter.recordFailure(input).allowed, true);
  limiter.recordSuccess(input);
  assert.equal(limiter.recordFailure(input).allowed, true);
});

test('login source prefers the first forwarded client address', () => {
  const request = new Request('https://aprendo.example/api/auth/login/', {
    headers: {
      'x-forwarded-for': '203.0.113.50, 10.0.0.1',
      'x-real-ip': '10.0.0.2',
    },
  });
  assert.equal(loginClientSource(request), '203.0.113.50');
  assert.equal(loginClientSource(new Request('https://aprendo.example/')), 'direct');
});
