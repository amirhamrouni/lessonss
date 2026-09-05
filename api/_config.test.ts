import { describe, expect, it } from 'vitest';
import { getFirebaseProjectId, getServerReadiness, shouldRequirePersistentQuota } from './_config';

describe('server readiness config', () => {
  it('uses the production Firebase project fallback', () => {
    expect(getFirebaseProjectId({} as NodeJS.ProcessEnv)).toBe('gen-lang-client-0217548336');
  });

  it('requires Gemini but allows instance quota when persistent quota is optional', () => {
    const state = getServerReadiness({ GEMINI_API_KEY: 'server-key' } as NodeJS.ProcessEnv);
    expect(state.ready).toBe(true);
    expect(state.firebaseProjectId).toBe('gen-lang-client-0217548336');
    expect(state.missing).toEqual([]);
    expect(state.firebaseAdminConfigured).toBe(false);
    expect(state.persistentQuotaConfigured).toBe(false);
    expect(state.persistentQuotaRequired).toBe(false);
  });

  it('reports missing Gemini when AI is not configured', () => {
    const state = getServerReadiness({} as NodeJS.ProcessEnv);
    expect(state.ready).toBe(false);
    expect(state.missing).toEqual(['GEMINI_API_KEY']);
  });

  it('requires Firebase Admin only when persistent quota is explicitly required', () => {
    const state = getServerReadiness({
      GEMINI_API_KEY: 'server-key',
      REQUIRE_PERSISTENT_QUOTA: 'true',
    } as NodeJS.ProcessEnv);
    expect(state.ready).toBe(false);
    expect(state.missing).toEqual(['FIREBASE_SERVICE_ACCOUNT_JSON']);
    expect(state.persistentQuotaRequired).toBe(true);
  });

  it('becomes ready with privileged Firebase and Gemini credentials', () => {
    const state = getServerReadiness({
      FIREBASE_PROJECT_ID: 'english-twin-prod',
      FIREBASE_SERVICE_ACCOUNT_JSON: '{"project_id":"english-twin-prod"}',
      GEMINI_API_KEY: 'server-key',
      GEMINI_MODEL: 'gemini-model',
      GEMINI_LIVE_MODEL: 'gemini-live-model',
      REQUIRE_PERSISTENT_QUOTA: 'true',
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
