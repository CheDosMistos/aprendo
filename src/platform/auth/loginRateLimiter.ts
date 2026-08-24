const DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_ACCOUNT_LIMIT = 5;
const DEFAULT_SOURCE_LIMIT = 20;
const DEFAULT_ACCOUNT_BLOCK_MS = 15 * 60 * 1000;
const DEFAULT_SOURCE_BLOCK_MS = 5 * 60 * 1000;
const MAX_BUCKETS = 5_000;

interface Bucket {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number;
  lastSeenAt: number;
}

export interface LoginRateLimitOptions {
  now?: () => number;
  windowMs?: number;
  accountLimit?: number;
  sourceLimit?: number;
  accountBlockMs?: number;
  sourceBlockMs?: number;
}

export interface LoginRateLimitInput {
  source: string;
  username: string;
}

export interface LoginRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export class LoginRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly now: () => number;
  private readonly windowMs: number;
  private readonly accountLimit: number;
  private readonly sourceLimit: number;
  private readonly accountBlockMs: number;
  private readonly sourceBlockMs: number;

  constructor(options: LoginRateLimitOptions = {}) {
    this.now = options.now ?? Date.now;
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    this.accountLimit = options.accountLimit ?? DEFAULT_ACCOUNT_LIMIT;
    this.sourceLimit = options.sourceLimit ?? DEFAULT_SOURCE_LIMIT;
    this.accountBlockMs = options.accountBlockMs ?? DEFAULT_ACCOUNT_BLOCK_MS;
    this.sourceBlockMs = options.sourceBlockMs ?? DEFAULT_SOURCE_BLOCK_MS;
  }

  check(input: LoginRateLimitInput): LoginRateLimitDecision {
    const now = this.now();
    this.cleanup(now);
    const keys = this.keys(input);
    return this.combineDecisions([
      this.decisionFor(keys.source, now),
      this.decisionFor(keys.account, now),
    ]);
  }

  recordFailure(input: LoginRateLimitInput): LoginRateLimitDecision {
    const now = this.now();
    this.cleanup(now);
    const keys = this.keys(input);
    this.increment(keys.source, this.sourceLimit, this.sourceBlockMs, now);
    this.increment(keys.account, this.accountLimit, this.accountBlockMs, now);
    return this.combineDecisions([
      this.decisionFor(keys.source, now),
      this.decisionFor(keys.account, now),
    ]);
  }

  recordSuccess(input: LoginRateLimitInput): void {
    this.buckets.delete(this.keys(input).account);
  }

  private keys(input: LoginRateLimitInput): { source: string; account: string } {
    const source = normalizeSource(input.source);
    const username = input.username.trim().toLowerCase().slice(0, 80);
    return {
      source: `source:${source}`,
      account: `account:${source}:${username}`,
    };
  }

  private decisionFor(key: string, now: number): LoginRateLimitDecision {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.blockedUntil <= now) return { allowed: true, retryAfterSeconds: 0 };
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000)),
    };
  }

  private increment(key: string, limit: number, blockMs: number, now: number): void {
    const current = this.buckets.get(key);
    const bucket = !current || now - current.windowStartedAt >= this.windowMs
      ? { attempts: 0, windowStartedAt: now, blockedUntil: 0, lastSeenAt: now }
      : current;

    bucket.attempts += 1;
    bucket.lastSeenAt = now;
    if (bucket.attempts >= limit) bucket.blockedUntil = Math.max(bucket.blockedUntil, now + blockMs);
    this.buckets.set(key, bucket);
  }

  private combineDecisions(decisions: LoginRateLimitDecision[]): LoginRateLimitDecision {
    const retryAfterSeconds = Math.max(...decisions.map((decision) => decision.retryAfterSeconds));
    return retryAfterSeconds > 0
      ? { allowed: false, retryAfterSeconds }
      : { allowed: true, retryAfterSeconds: 0 };
  }

  private cleanup(now: number): void {
    const staleBefore = now - Math.max(this.windowMs, this.accountBlockMs, this.sourceBlockMs) * 2;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastSeenAt < staleBefore && bucket.blockedUntil <= now) this.buckets.delete(key);
    }

    if (this.buckets.size <= MAX_BUCKETS) return;
    const oldest = [...this.buckets.entries()]
      .sort((left, right) => left[1].lastSeenAt - right[1].lastSeenAt)
      .slice(0, this.buckets.size - MAX_BUCKETS);
    for (const [key] of oldest) this.buckets.delete(key);
  }
}

export function loginClientSource(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return forwardedFor || realIp || 'direct';
}

function normalizeSource(source: string): string {
  return source.trim().slice(0, 128) || 'direct';
}
