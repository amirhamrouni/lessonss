import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('English Twin visual contract', () => {
  it('keeps v12 as the only canonical product UI layer', () => {
    const main = source('../main.tsx');
    expect(main).toContain("import './product-system-v12.css';");
    expect(main).not.toContain("product-system-v11.css");
    expect(main).not.toContain('editorial-foundation.css');
    expect(main).not.toContain('reference-ui.css');
  });

  it('keeps rejected mascot assets out of runtime UI', () => {
    const home = source('../SmartHomeV2.tsx');
    const css = source('../product-system-v12.css');
    expect(home).not.toMatch(/tutor-avatar|mascot|robot/i);
    expect(css).not.toMatch(/tutor-avatar/i);
  });

  it('defines compact mobile, RTL and accessibility safeguards', () => {
    const css = source('../product-system-v12.css');
    expect(css).toContain('@media (max-width: 360px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('[dir="rtl"]');
    expect(css).toContain('focus-visible');
    expect(css).toContain('env(safe-area-inset-bottom)');
  });

  it('keeps lessons distraction-free and interaction states explicit', () => {
    const lesson = source('../AutoLessonPlayer.tsx');
    const css = source('../product-system-v12.css');
    expect(lesson).toContain('showDock={false}');
    expect(lesson).toContain('state={choiceState(');
    expect(css).toContain('.et-choice-selected');
    expect(css).toContain('.et-choice-correct');
    expect(css).toContain('.et-choice-wrong');
    expect(css).toContain('.et-lesson-footer');
  });

  it('keeps the dock to five destinations while nested routes retain section state', () => {
    const dock = source('../AppDock.tsx');
    for (const route of ["'/'", "'/learn'", "'/practice'", "'/speak'", "'/profile'"]) {
      expect(dock).toContain(route);
    }
    expect(dock).toContain("'/review'");
    expect(dock).toContain("'/sentence-builder'");
    expect(dock).toContain("'/assessment'");
    expect(dock).toContain("'/twin'");
    expect(dock).toContain("'/pronunciation'");
    expect(dock).toContain("'/speak/live'");
    expect(dock).toContain("'/mistakes'");
    expect(dock).toContain("'/privacy'");
    expect(dock).toContain('aria-current');
  });

  it('uses shared loading and recoverable error states on core learner screens', () => {
    const ui = source('./LearningUI.tsx');
    expect(ui).toContain('export function StatusState');
    for (const file of ['../SmartHomeV2.tsx', '../ReferenceLearnJourney.tsx', '../SpeechDrill.tsx', '../ProfileHub.tsx']) {
      const screen = source(file);
      expect(screen).toContain('StatusState');
      expect(screen).toContain('loadError');
    }
  });

  it('does not mark the first daily task complete just because any weekly lesson exists', () => {
    const home = source('../SmartHomeV2.tsx');
    expect(home).not.toContain('index === 0 && weeklyCompleted > 0');
    expect(home).toContain("item.id === 'foundation'");
    expect(home).toContain("item.id === 'lesson'");
  });

  it('keeps course unlocking sequential across unit boundaries', () => {
    const learn = source('../ReferenceLearnJourney.tsx');
    expect(learn).toContain('function lessonUnlocked');
    expect(learn).toContain('levelLessons[globalIndex - 1]');
    expect(learn).not.toContain('lessonIndex === 0 || complete');
  });

  it('keeps account deletion aligned with generated learner data', () => {
    const profile = source('../ProfileHub.tsx');
    expect(profile).toContain("'assessments'");
    expect(profile).toContain("english-twin-guided-speech-consent-v1");
  });
});
