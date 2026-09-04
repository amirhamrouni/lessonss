import { describe, expect, it } from 'vitest';
import { pronunciationItems, pronunciationPriority, prioritizePronunciationItems } from './pronunciationData';

describe('pronunciation curriculum', () => {
  it('contains a word-to-sentence pair for every item', () => {
    expect(pronunciationItems.length).toBeGreaterThanOrEqual(12);
    for (const item of pronunciationItems) {
      expect(item.word.length).toBeGreaterThan(0);
      expect(item.sentence.toLowerCase()).toContain(item.word.toLowerCase());
      expect(item.syllables.length).toBeGreaterThan(0);
      expect(item.stressIndex).toBeGreaterThanOrEqual(0);
      expect(item.stressIndex).toBeLessThan(item.syllables.length);
    }
  });

  it('moves repeated Error Memory words to the front', () => {
    const mistakes = [{ corrected: 'I have three meetings today.', timesSeen: 4 }];
    const sorted = prioritizePronunciationItems(pronunciationItems, mistakes);
    expect(sorted[0].word).toBe('three');
    expect(pronunciationPriority(sorted[0], mistakes)).toBe(4);
  });

  it('does not boost unrelated mistakes', () => {
    const item = pronunciationItems.find(value => value.word === 'coffee')!;
    expect(pronunciationPriority(item, [{ corrected: 'Turn right here.', timesSeen: 3 }])).toBe(0);
  });
});
