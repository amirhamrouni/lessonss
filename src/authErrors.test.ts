import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './authErrors';

describe('authErrorMessage', () => {
  it('hides credential details behind a safe message', () => {
    expect(authErrorMessage(new Error('Firebase: Error (auth/invalid-credential).'))).toBe('Email or password is incorrect.');
  });

  it('maps network failures to an actionable message', () => {
    expect(authErrorMessage(new Error('Firebase: Error (auth/network-request-failed).'))).toContain('Check your internet');
  });

  it('does not leak unknown SDK messages', () => {
    expect(authErrorMessage(new Error('Firebase: Error (auth/internal-error): secret detail'))).toBe('Sign-in could not be completed. Please try again.');
  });
});
