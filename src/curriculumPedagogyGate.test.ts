import { describe, expect, it } from 'vitest';
import { b1, b2, c1, unitsForLevel } from './curriculumAll';
import type { LessonV2 } from './curriculumV2';

const advanced: Record<'B1'|'B2'|'C1', LessonV2[]> = { B1: b1, B2: b2, C1: c1 };

function unitLessons(level: keyof typeof advanced, unitId: string): LessonV2[] {
  return advanced[level].filter(lesson => lesson.unitId === unitId);
}

describe('advanced curriculum pedagogical release gate', () => {
  it('keeps every B1-C1 unit as a five-lesson progression', () => {
    for (const level of ['B1','B2','C1'] as const) {
      for (const unit of unitsForLevel(level)) {
        expect(unitLessons(level, unit.id), `${level}/${unit.id}`).toHaveLength(5);
      }
    }
  });

  it('gives every advanced unit receptive, productive and mediation evidence', () => {
    for (const level of ['B1','B2','C1'] as const) {
      for (const unit of unitsForLevel(level)) {
        const lessons = unitLessons(level, unit.id);
        const skills = new Set(lessons.flatMap(lesson => lesson.skills));
        expect(skills.has('reading'), `${unit.id} missing reading`).toBe(true);
        expect(skills.has('listening'), `${unit.id} missing listening`).toBe(true);
        expect(skills.has('writing'), `${unit.id} missing writing`).toBe(true);
        expect(skills.has('spoken_interaction'), `${unit.id} missing spoken interaction`).toBe(true);
        expect(skills.has('spoken_production'), `${unit.id} missing spoken production`).toBe(true);
        expect(skills.has('mediation'), `${unit.id} missing mediation`).toBe(true);
      }
    }
  });

  it('requires open production and critical reading in every advanced unit', () => {
    for (const level of ['B1','B2','C1'] as const) {
      for (const unit of unitsForLevel(level)) {
        const types = new Set(unitLessons(level, unit.id).flatMap(lesson => lesson.activities.map(activity => activity.type)));
        expect(types.has('critical_reading'), `${unit.id} missing critical reading`).toBe(true);
        expect(types.has('open_speaking'), `${unit.id} missing open speaking`).toBe(true);
        expect(types.has('free_writing'), `${unit.id} missing free writing`).toBe(true);
      }
    }
  });

  it('requires multi-source synthesis in every B2 and C1 unit', () => {
    for (const level of ['B2','C1'] as const) {
      for (const unit of unitsForLevel(level)) {
        const synthesis = unitLessons(level, unit.id)
          .flatMap(lesson => lesson.activities)
          .filter(activity => activity.type === 'paragraph_synthesis');
        expect(synthesis.length, `${unit.id} missing synthesis`).toBeGreaterThan(0);
        for (const activity of synthesis) {
          if (activity.type !== 'paragraph_synthesis') continue;
          expect(activity.sources.length).toBeGreaterThanOrEqual(2);
          expect(new Set(activity.sources.map(source => source.id)).size).toBe(activity.sources.length);
        }
      }
    }
  });

  it('keeps source and prompt material substantive rather than placeholder content', () => {
    const placeholder = /lorem ipsum|todo|tbd|placeholder|sample text/i;
    for (const lesson of [...b1, ...b2, ...c1]) {
      expect(placeholder.test(`${lesson.title} ${lesson.objective}`), lesson.id).toBe(false);
      for (const activity of lesson.activities) {
        expect(placeholder.test(JSON.stringify(activity)), `${lesson.id}/${activity.id}`).toBe(false);
      }
    }
  });
});
