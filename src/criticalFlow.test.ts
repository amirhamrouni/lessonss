import { describe, expect, it } from 'vitest';
import { resolveEntryRoute, resolveFirstLearningRoute } from './criticalFlow';

describe('critical release flow', () => {
  it('sends signed-out visitors to authentication', () => {
    expect(resolveEntryRoute({ authenticated: false })).toBe('/welcome');
  });

  it('sends authenticated learners without completed setup to setup', () => {
    expect(resolveEntryRoute({ authenticated: true, profile: null })).toBe('/setup');
    expect(resolveEntryRoute({ authenticated: true, profile: { onboardingCompleted: true } })).toBe('/setup');
  });

  it('sends configured learners to the adaptive home', () => {
    expect(resolveEntryRoute({ authenticated: true, profile: { onboardingCompleted: true, nativeLanguage: 'Arabic' } })).toBe('/');
  });

  it('keeps true beginners on the visual foundation before the full learning path', () => {
    expect(resolveFirstLearningRoute({ onboardingCompleted: true, nativeLanguage: 'Arabic', beginnerFoundationCompleted: false })).toBe('/start');
    expect(resolveFirstLearningRoute({ onboardingCompleted: true, nativeLanguage: 'Arabic', beginnerFoundationCompleted: true })).toBe('/learn');
  });
});
