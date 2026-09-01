import { describe, expect, it } from 'vitest';
import { lessonById, lessons, lessonsForLevel, lessonsForUnit, units } from './curriculumAll';

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

  it('starts A1 with a visual and listening-first lesson instead of grammar', () => {
    const first = lessonById('a1-u1-l1') as unknown as { activities: Array<{ type: string }>; skill: string };
    const types = first.activities.map(activity => activity.type);

    expect(first.skill).toBe('Vocabulary');
    expect(types[0]).toBe('visual_word');
    expect(types).toContain('listen_select');
    expect(types).toContain('image_choice');
    expect(types).toContain('sentence_build');
    expect(types).not.toContain('grammar');
  });

  it('keeps the first rich lesson substantial enough for a real learning session', () => {
    const first = lessonById('a1-u1-l1');
    expect(first.activities.length).toBeGreaterThanOrEqual(8);
  });
});
