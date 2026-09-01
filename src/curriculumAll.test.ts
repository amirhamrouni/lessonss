import { describe, expect, it } from 'vitest';
import { a1, lessons, lessonsForLevel, lessonsForUnit, richA1, units } from './curriculumAll';

describe('unified A1-A2 curriculum', () => {
  it('has unique lesson ids', () => {
    const ids = lessons.map(lesson => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains the full A2 starter pack', () => {
    expect(lessonsForLevel('A2')).toHaveLength(12);
    expect(units.filter(unit => unit.id.startsWith('a2-'))).toHaveLength(4);
  });

  it('keeps every unit wired to real lesson content', () => {
    for (const unit of units) {
      const actual = lessonsForUnit(unit.id);
      expect(actual.length).toBeGreaterThan(0);
      expect(actual.map(lesson => lesson.id)).toEqual(unit.lessons);
    }
  });

  it('requires meaningful activities in every lesson', () => {
    for (const lesson of lessons) {
      expect(lesson.activities.length).toBeGreaterThanOrEqual(2);
      expect(lesson.objective.length).toBeGreaterThan(10);
      expect(lesson.minutes).toBeGreaterThanOrEqual(5);
    }
  });

  it('replaces every A1 lesson with the rich engine', () => {
    expect(richA1).toHaveLength(a1.length);
    expect(new Set(richA1.map(lesson => lesson.id))).toEqual(new Set(a1.map(lesson => lesson.id)));
    expect(new Set(richA1.map(lesson => lesson.unitId)).size).toBe(6);
  });

  it('makes vocabulary-rich beginner lessons multimodal', () => {
    for (const lesson of richA1.filter(lesson => lesson.skill === 'Vocabulary')) {
      const types = lesson.activities.map(activity => activity.type);
      expect(types).toContain('visual_word');
      expect(types).toContain('listen_select');
      expect(lesson.activities.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('keeps the first two lessons meaning-first instead of grammar-first', () => {
    const firstTwo = richA1.filter(lesson => lesson.id === 'a1-u1-l1' || lesson.id === 'a1-u1-l2');
    expect(firstTwo).toHaveLength(2);
    for (const lesson of firstTwo) {
      expect(lesson.skill).not.toBe('Grammar');
      expect(lesson.activities[0]?.type).toBe('visual_word');
      expect(lesson.activities.some(activity => activity.type === 'listen_select')).toBe(true);
    }
  });

  it('teaches grammar through context before abstract checking', () => {
    const grammarLessons = richA1.filter(lesson => lesson.skill === 'Grammar');
    expect(grammarLessons).toHaveLength(4);
    for (const lesson of grammarLessons) {
      expect(lesson.activities[0]?.type).toBe('visual_word');
      expect(lesson.activities[1]?.type).toBe('listen_select');
      expect(lesson.activities.some(activity => activity.type === 'sentence_build')).toBe(true);
      expect(lesson.activities[0]?.type).not.toBe('fill');
      expect(lesson.activities[0]?.type).not.toBe('explain');
    }
  });

  it('includes practical speaking before abstract grammar expansion', () => {
    const ids = new Set(richA1.map(lesson => lesson.id));
    expect(ids.has('a1-u4-l2')).toBe(true);
    expect(ids.has('a1-u5-l2')).toBe(true);
    expect(ids.has('a1-u6-l1')).toBe(true);
  });
});
