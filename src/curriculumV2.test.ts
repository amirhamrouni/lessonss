import { describe, expect, it } from 'vitest';
import { a1, a2, advancedLessonsV2, b1, b2, c1, lessons, lessonsForLevel, unitsForLevel } from './curriculumAll';
import { adaptLegacyLesson, isLessonV2, validateLessonV2, type Skill } from './curriculumV2';

describe('Curriculum Engine v2 contracts', () => {
  it('preserves all existing A1 and A2 lesson ids while adding B1-B2-C1', () => {
    const allIds = new Set(lessons.map(lesson => lesson.id));
    for (const lesson of [...a1, ...a2]) expect(allIds.has(lesson.id)).toBe(true);
    expect(a1).toHaveLength(13);
    expect(a2).toHaveLength(12);
    expect(b1).toHaveLength(40);
    expect(b2).toHaveLength(40);
    expect(c1).toHaveLength(40);
    expect(advancedLessonsV2).toHaveLength(120);
  });

  it('defines exactly eight units and forty lessons for each advanced CEFR level', () => {
    for (const level of ['B1','B2','C1'] as const) {
      expect(unitsForLevel(level)).toHaveLength(8);
      expect(lessonsForLevel(level)).toHaveLength(40);
    }
  });

  it('keeps every lesson and advanced activity id globally unique', () => {
    const lessonIds = lessons.map(lesson => lesson.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    const activityIds = advancedLessonsV2.flatMap(lesson => lesson.activities.map(activity => activity.id));
    expect(new Set(activityIds).size).toBe(activityIds.length);
  });

  it('validates every native v2 lesson and maps every activity to a can-do descriptor', () => {
    for (const lesson of advancedLessonsV2) {
      expect(validateLessonV2(lesson), lesson.id).toEqual([]);
      expect(lesson.canDo.length).toBeGreaterThan(0);
      expect(lesson.activities.length).toBeGreaterThan(0);
      for (const activity of lesson.activities) {
        expect(activity.level).toBe(lesson.level);
        expect(activity.canDoIds.length).toBeGreaterThan(0);
        expect(activity.canDoIds.every(id => lesson.canDo.some(item => item.id === id))).toBe(true);
      }
    }
  });

  it('covers the advanced receptive, productive and mediation skill model', () => {
    const required: Skill[] = ['vocabulary','grammar','reading','listening','spoken_interaction','spoken_production','writing','pronunciation','mediation'];
    for (const level of ['B1','B2','C1'] as const) {
      const levelSkills = new Set(lessonsForLevel(level).flatMap(lesson => isLessonV2(lesson) ? lesson.skills : []));
      for (const skill of required) expect(levelSkills.has(skill), `${level} missing ${skill}`).toBe(true);
    }
  });

  it('makes synthesis explicit from B2 and demanding integrated production explicit at C1', () => {
    const b2Types = new Set(b2.flatMap(lesson => lesson.activities.map(activity => activity.type)));
    const c1Types = new Set(c1.flatMap(lesson => lesson.activities.map(activity => activity.type)));
    expect(b2Types.has('paragraph_synthesis')).toBe(true);
    expect(b2Types.has('critical_reading')).toBe(true);
    expect(c1Types.has('paragraph_synthesis')).toBe(true);
    expect(c1Types.has('presentation')).toBe(true);
    expect(c1Types.has('critical_reading')).toBe(true);
    expect(c1Types.has('open_speaking')).toBe(true);
  });

  it('keeps advanced assessment answers out of open-response activities', () => {
    for (const lesson of advancedLessonsV2) {
      for (const activity of lesson.activities) {
        if (['critical_reading','guided_writing','free_writing','paragraph_synthesis','summarization','paraphrase','argument_builder','roleplay','open_speaking','mediation','source_comparison','presentation'].includes(activity.type)) {
          expect('answer' in activity, `${lesson.id}/${activity.id} leaks an open-response answer`).toBe(false);
        }
      }
    }
  });

  it('adapts legacy lessons without changing their historical ids', () => {
    for (const lesson of [...a1, ...a2]) {
      const adapted = adaptLegacyLesson(lesson as any);
      expect(adapted.id).toBe(lesson.id);
      expect(adapted.unitId).toBe(lesson.unitId);
      expect(adapted.schemaVersion).toBe(2);
      expect(['A1','A2']).toContain(adapted.level);
    }
  });
});
