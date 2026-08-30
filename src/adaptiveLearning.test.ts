import { describe, expect, it } from 'vitest';
import { buildDailyPlan, weakestMeasuredSkill } from './adaptiveLearning';

describe('adaptive daily plan', () => {
  it('prioritizes due reviews before the next lesson', () => {
    const plan = buildDailyPlan({ dailyTargetMinutes: 15, dueReviews: 6, nextLessonId: 'a1-u1-l1', weakestSkill: 'grammar', speakingAvailable: true });
    expect(plan[0].id).toBe('review');
    expect(plan.some(item => item.id === 'lesson')).toBe(true);
    expect(plan.reduce((sum, item) => sum + item.minutes, 0)).toBeLessThanOrEqual(15);
  });

  it('never invents a weak skill without measured data', () => {
    expect(weakestMeasuredSkill()).toBeNull();
    expect(weakestMeasuredSkill({ speaking: 'A1', grammar: 'A2' })).toBe('speaking');
  });
});
