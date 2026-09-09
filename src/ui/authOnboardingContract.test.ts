import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('English Twin auth and onboarding release contract', () => {
  it('never bypasses learner-profile verification after a Firestore failure', () => {
    const auth = source('../AuthGateway.tsx');
    expect(auth).toContain('setSessionError(');
    expect(auth).toContain('setReloadKey(value => value + 1)');
    expect(auth).toContain('StatusState');
    expect(auth).toContain('signOut(auth)');
    expect(auth).not.toContain("catch {\n      setSessionTarget('/');");
  });

  it('keeps the rejected robot-style login mascot out of the auth screen', () => {
    const auth = source('../AuthGateway.tsx');
    expect(auth).toContain('function BrandMark()');
    expect(auth).not.toContain('function TwinMark()');
    expect(auth).not.toContain('twin-core');
    expect(auth).not.toContain('twin-eye');
  });

  it('makes onboarding profile loading and saving explicit and recoverable', () => {
    const setup = source('../LearnerSetup.tsx');
    expect(setup).toContain('setLoadError(true)');
    expect(setup).toContain('setReloadKey(value => value + 1)');
    expect(setup).toContain('setSaveError(state.saveError)');
    expect(setup).toContain('StatusState');
    expect(setup).toContain('role="progressbar"');
    expect(setup).toContain('aria-busy={busy}');
  });
});
