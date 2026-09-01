import { describe, expect, it } from 'vitest';
import { checkRateLimit, clearExpiredRateLimits } from './_rateLimit';

describe('authenticated API rate limiter', () => {
  it('allows requests until the configured limit and then blocks', () => {
    const key = 'test-user-limit';
    const now = 1_000;

    expect(checkRateLimit(key, 2, 60_000, now)).toMatchObject({ allowed: true, remaining: 1 });
    expect(checkRateLimit(key, 2, 60_000, now + 1)).toMatchObject({ allowed: true, remaining: 0 });
    const blocked = checkRateLimit(key, 2, 60_000, now + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets a user bucket after the window expires', () => {
    const key = 'test-user-reset';
    expect(checkRateLimit(key, 1, 1_000, 10_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 1_000, 10_500).allowed).toBe(false);
    expect(checkRateLimit(key, 1, 1_000, 11_001)).toMatchObject({ allowed: true, remaining: 0 });
  });

  it('keeps user buckets isolated', () => {
    expect(checkRateLimit('user-a', 1, 60_000, 50_000).allowed).toBe(true);
    expect(checkRateLimit('user-a', 1, 60_000, 50_001).allowed).toBe(false);
    expect(checkRateLimit('user-b', 1, 60_000, 50_001).allowed).toBe(true);
  });

  it('can clear expired buckets without affecting active buckets', () => {
    expect(checkRateLimit('expired', 1, 100, 100).allowed).toBe(true);
    expect(checkRateLimit('active', 1, 10_000, 100).allowed).toBe(true);
    clearExpiredRateLimits(500);
    expect(checkRateLimit('expired', 1, 100, 500).allowed).toBe(true);
    expect(checkRateLimit('active', 1, 10_000, 500).allowed).toBe(false);
  });
});
