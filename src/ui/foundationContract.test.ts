import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('A0 foundation release contract', () => {
  it('fails visibly when saved foundation progress cannot be loaded', () => {
    const screen = source('../BeginnerFoundation.tsx');
    expect(screen).toContain('setLoadError(true)');
    expect(screen).toContain('StatusState');
    expect(screen).toContain('setReloadKey(value => value + 1)');
  });

  it('does not advance local progress when Firestore saving fails', () => {
    const screen = source('../BeginnerFoundation.tsx');
    expect(screen).toContain('await setDoc');
    expect(screen).toContain('setCompletedWordIds(nextIds)');
    expect(screen).toContain('setSaveError(copy.saveError)');
    expect(screen.indexOf('await setDoc')).toBeLessThan(screen.indexOf('setCompletedWordIds(nextIds)'));
  });

  it('redirects already-complete learners to the learning path', () => {
    const screen = source('../BeginnerFoundation.tsx');
    expect(screen).toContain('data.beginnerFoundationCompleted === true || savedIds.length >= words.length');
    expect(screen).toContain("nav('/learn', { replace: true })");
  });

  it('keeps A0 navigation sequential and exposes progress semantics', () => {
    const screen = source('../BeginnerFoundation.tsx');
    expect(screen).toContain('const previousComplete = nextPack === 0 ||');
    expect(screen).toContain('role="progressbar"');
    expect(screen).toContain('aria-valuenow={totalPercent}');
    expect(screen).toContain('aria-busy={saving}');
  });
});
