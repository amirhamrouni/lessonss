import { getFirestore } from 'firebase-admin/firestore';
import { shouldRequirePersistentQuota } from './_config.js';

export type QuotaState = { count: number; resetAtMs: number };
export type QuotaResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

const memoryQuota = new Map<string, QuotaState>();

export function evaluateQuotaState(
  current: QuotaState | null,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { next: QuotaState; result: QuotaResult } {
  if (!current || now >= current.resetAtMs) {
    const next = { count: 1, resetAtMs: now + windowMs };
    return { next, result: { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 } };
  }

  if (current.count >= limit) {
    return {
      next: current,
      result: {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAtMs - now) / 1000)),
      },
    };
  }

  const next = { ...current, count: current.count + 1 };
  return { next, result: { allowed: true, remaining: Math.max(0, limit - next.count), retryAfterSeconds: 0 } };
}

function safeQuotaId(key: string) {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 180);
}

function checkMemoryQuota(key: string, limit: number, windowMs: number, now: number) {
  const id = safeQuotaId(key);
  const current = memoryQuota.get(id) || null;
  const { next, result } = evaluateQuotaState(current, limit, windowMs, now);
  if (result.allowed) memoryQuota.set(id, next);
  return result;
}

export async function checkPersistentQuota(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<QuotaResult> {
  try {
    const db = getFirestore();
    const ref = db.collection('__serverQuotas').doc(safeQuotaId(key));

    return await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const raw = snapshot.exists ? snapshot.data() : undefined;
      const current = raw && typeof raw.count === 'number' && typeof raw.resetAtMs === 'number'
        ? { count: raw.count, resetAtMs: raw.resetAtMs }
        : null;
      const { next, result } = evaluateQuotaState(current, limit, windowMs, now);
      if (result.allowed) transaction.set(ref, next, { merge: true });
      return result;
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown';
    if (shouldRequirePersistentQuota()) {
      console.error('Persistent quota required but unavailable', reason);
      throw new Error('PERSISTENT_QUOTA_UNAVAILABLE');
    }
    console.warn('Persistent quota unavailable; using instance-local fallback', reason);
    return checkMemoryQuota(key, limit, windowMs, now);
  }
}
