import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('English Twin support-language direction contract', () => {
  it('keeps English as the fixed target while support languages teach into English', () => {
    const profile = source('../ProfileHub.tsx');
    expect(profile).toContain("targetLanguage:'English'");
    expect(profile).toContain("learningLanguage:'English'");
    expect(profile).toContain('Your language → English');
    expect(profile).toContain('{supportMeta.nativeLabel} → English');
    expect(profile).toContain('French, Dutch, Arabic, German or Spanish learner');
  });

  it('does not make Firebase Auth display-name sync a hard failure for Firestore profile saving', () => {
    const profile = source('../ProfileHub.tsx');
    expect(profile).toContain("await setDoc(doc(db,'users',user.uid)");
    expect(profile).toContain("console.warn('Auth display-name sync skipped after profile save'");
    expect(profile).not.toContain('Promise.all([setDoc');
  });

  it('exposes the supported teaching languages from the canonical language registry', () => {
    const languages = source('../languageSupport.ts');
    for (const language of ['Arabic', 'Dutch', 'French', 'German', 'Spanish']) {
      expect(languages).toContain(`value: '${language}'`);
    }
  });
});
