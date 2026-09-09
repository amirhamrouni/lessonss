import { describe, expect, it } from 'vitest';
import { getFirebaseAdminCredentialSource, getFirebaseProjectId, getLiveModel, getServerReadiness, getTutorModel, shouldRequirePersistentQuota } from './_config';

describe('server readiness config', () => {
  it('uses the production Firebase project fallback and explicit model defaults', () => {
    expect(getFirebaseProjectId({} as NodeJS.ProcessEnv)).toBe('gen-lang-client-0217548336');
    expect(getTutorModel({} as NodeJS.ProcessEnv)).toBe('gemini-3.6-flash');
    expect(getLiveModel({} as NodeJS.ProcessEnv)).toBe('gemini-3.1-flash-live-preview');
  });

  it('requires Gemini but allows instance quota when persistent quota is optional', () => {
    const state = getServerReadiness({ GEMINI_API_KEY: 'server-key' } as NodeJS.ProcessEnv);
    expect(state.ready).toBe(true);
    expect(state.firebaseProjectId).toBe('gen-lang-client-0217548336');
    expect(state.missing).toEqual([]);
    expect(state.firebaseAdminConfigured).toBe(false);
    expect(state.persistentQuotaConfigured).toBe(false);
    expect(state.persistentQuotaRequired).toBe(false);
    expect(state.tutorModelConfigured).toBe(true);
    expect(state.liveModelConfigured).toBe(true);
  });

  it('reports missing Gemini when AI is not configured', () => {
    const state = getServerReadiness({} as NodeJS.ProcessEnv);
    expect(state.ready).toBe(false);
    expect(state.missing).toEqual(['GEMINI_API_KEY']);
  });

  it('requires privileged Firebase credentials only when persistent quota is explicitly required', () => {
    const state = getServerReadiness({
      GEMINI_API_KEY: 'server-key',
      REQUIRE_PERSISTENT_QUOTA: 'true',
    } as NodeJS.ProcessEnv);
    expect(state.ready).toBe(false);
    expect(state.missing).toEqual(['FIREBASE_ADMIN_CREDENTIALS']);
    expect(state.persistentQuotaRequired).toBe(true);
  });

  it('accepts both service-account JSON and split Firebase Admin credentials', () => {
    expect(getFirebaseAdminCredentialSource({ FIREBASE_SERVICE_ACCOUNT_JSON: '{"project_id":"x"}' } as NodeJS.ProcessEnv)).toBe('service-account-json');
    expect(getFirebaseAdminCredentialSource({ FIREBASE_CLIENT_EMAIL: 'svc@example.com', FIREBASE_PRIVATE_KEY: 'key' } as NodeJS.ProcessEnv)).toBe('split-env');
    expect(getFirebaseAdminCredentialSource({} as NodeJS.ProcessEnv)).toBe('none');
  });

  it('becomes ready with privileged Firebase and Gemini credentials', () => {
    const state = getServerReadiness({
      FIREBASE_PROJECT_ID: 'english-twin-prod',
      FIREBASE_CLIENT_EMAIL: 'svc@example.com',
      FIREBASE_PRIVATE_KEY: 'private-key',
      GEMINI_API_KEY: 'server-key',
      REQUIRE_PERSISTENT_QUOTA: 'true',
    } as NodeJS.ProcessEnv);
    expect(state.ready).toBe(true);
    expect(state.missing).toEqual([]);
    expect(state.firebaseAdminConfigured).toBe(true);
    expect(state.firebaseAdminCredentialSource).toBe('split-env');
    expect(state.geminiConfigured).toBe(true);
  });

  it('parses the persistent quota fail-closed switch', () => {
    expect(shouldRequirePersistentQuota({ REQUIRE_PERSISTENT_QUOTA: 'true' } as NodeJS.ProcessEnv)).toBe(true);
    expect(shouldRequirePersistentQuota({ REQUIRE_PERSISTENT_QUOTA: '1' } as NodeJS.ProcessEnv)).toBe(true);
    expect(shouldRequirePersistentQuota({ REQUIRE_PERSISTENT_QUOTA: 'no' } as NodeJS.ProcessEnv)).toBe(false);
  });
});
