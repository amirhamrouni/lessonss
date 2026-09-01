import { describe, expect, it } from 'vitest';
import { foundationCategories, foundationVocabulary } from './foundationVocabulary';
import { supportedLanguages } from './languageSupport';

describe('A0 foundation vocabulary', () => {
  it('contains exactly 60 starter words', () => {
    expect(foundationVocabulary).toHaveLength(60);
  });

  it('covers all ten agreed beginner categories', () => {
    const categories = new Set(foundationVocabulary.map(item => item.category));
    expect(categories.size).toBe(10);
    for (const category of foundationCategories) expect(categories.has(category)).toBe(true);
  });

  it('uses unique stable ids', () => {
    const ids = foundationVocabulary.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has every supported translation plus usable audio text', () => {
    const languages = supportedLanguages.map(item => item.value);
    for (const item of foundationVocabulary) {
      expect(item.word.trim().length).toBeGreaterThan(0);
      expect(item.example.trim().length).toBeGreaterThan(0);
      expect(item.phonetic.trim().length).toBeGreaterThan(0);
      for (const language of languages) expect(item.meanings[language]?.trim().length).toBeGreaterThan(0);
    }
  });
});
