import { describe, expect, it } from 'vitest';
import { evaluateQuotaState } from './_quota';

describe('persistent quota state', () => {
  it('starts a fresh window with one consumed request', () => {
    const { next, result } = evaluateQuotaState(null, 3, 60_000, 1_000);
    expect(next).toEqual({ count: 1, resetAtMs: 61_000 });
    expect(result).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 0 });
  });

  it('increments inside the same window', () => {
    const { next, result } = evaluateQuotaState({ count: 1, resetAtMs: 61_000 }, 3, 60_000, 2_000);
    expect(next.count).toBe(2);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks after the limit and reports retry time', () => {
    const { next, result } = evaluateQuotaState({ count: 3, resetAtMs: 61_000 }, 3, 60_000, 31_000);
    expect(next.count).toBe(3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(30);
  });

  it('resets after the window expires', () => {
    const { next, result } = evaluateQuotaState({ count: 99, resetAtMs: 61_000 }, 3, 60_000, 61_000);
    expect(next).toEqual({ count: 1, resetAtMs: 121_000 });
    expect(result.allowed).toBe(true);
  });
});
