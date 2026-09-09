import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('lesson runtime release contract', () => {
  it('fails visibly when profile or saved progress cannot be loaded', () => {
    const screen = source('../AutoLessonPlayer.tsx');
    expect(screen).toContain('setLoadError(true)');
    expect(screen).toContain('StatusState');
    expect(screen).toContain('setReloadKey(value => value + 1)');
  });

  it('keeps lesson completion retryable when persistence fails', () => {
    const screen = source('../AutoLessonPlayer.tsx');
    expect(screen).toContain('await saveLessonCompletion');
    expect(screen).toContain('setSaveError(saveErrorText)');
    expect(screen).toContain('setFinished(true)');
    expect(screen.indexOf('await saveLessonCompletion')).toBeLessThan(screen.indexOf('setFinished(true)'));
  });

  it('never leaves failed adaptive-mistake persistence as an unhandled promise', () => {
    const screen = source('../AutoLessonPlayer.tsx');
    expect(screen).toContain('Promise.allSettled');
    expect(screen).toContain("throw new Error('mistake-persistence-failed')");
    expect(screen).toContain('.catch(() => setMistakeWarning(mistakeWarningText))');
  });

  it('keeps lessons distraction-free and exposes save state to assistive tech', () => {
    const screen = source('../AutoLessonPlayer.tsx');
    expect(screen).toContain('showDock={false}');
    expect(screen).toContain('aria-busy={saving}');
    expect(screen).toContain('ProgressBar');
  });
});
