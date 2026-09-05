import { describe, expect, it } from 'vitest';
import { getFirebaseProjectId, getServerReadiness, shouldRequirePersistentQuota } from './_config';

describe('server readiness config', () => {
  it('uses the production Firebase project fallback', () => {
    expect(getFirebaseProjectId({} as NodeJS.ProcessEnv)).toBe('gen-lang-client-0217548336');
  });

  it('reports missing server-only production requirements', () => {
    const state = getServerReadiness({} as NodeJS.ProcessEnv);
    expect(state.ready).toBe(false);
    expect(state.firebaseProjectId).toBe('gen-lang-client-0217548336');
    expect(state.missing).toEqual(['FIREBASE_SERVICE_ACCOUNT_JSON', 'GEMINI_API_KEY']);
    expect(state.persistentQuotaConfigured).toBe(false);
  });

  it('becomes ready when privileged Firebase and Gemini credentials are configured', () => {
    const state = getServerReadiness({
      FIREBASE_PROJECT_ID: 'english-twin-prod',
      FIREBASE_SERVICE_ACCOUNT_JSON: '{"project_id":"english-twin-prod"}',
      GEMINI_API_KEY: 'server-key',
      GEMINI_MODEL: 'gemini-model',
      GEMINI_LIVE_MODEL: 'gemini-live-model',
    } as NodeJS.ProcessEnv);
    expect(state.ready).toBe(true);
    expect(state.missing).toEqual([]);
    expect(state.firebaseAdminConfigured).toBe(true);
    expect(state.geminiConfigured).toBe(true);
  });

  it('parses the persistent quota fail-closed switch', () => {
    expect(shouldRequirePersistentQuota({ REQUIRE_PERSISTENT_QUOTA: 'true' } as NodeJS.ProcessEnv)).toBe(true);
    expect(shouldRequirePersistentQuota({ REQUIRE_PERSISTENT_QUOTA: '1' } as NodeJS.ProcessEnv)).toBe(true);
    expect(shouldRequirePersistentQuota({ REQUIRE_PERSISTENT_QUOTA: 'no' } as NodeJS.ProcessEnv)).toBe(false);
  });
});
