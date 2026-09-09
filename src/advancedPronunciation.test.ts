import { describe, expect, it } from 'vitest';
import { advancedPronunciationTasks, pronunciationTasksForLevel } from './advancedPronunciation';

describe('advanced pronunciation progression',()=>{
  it('provides a distinct B1-B2-C1 progression',()=>{
    expect(pronunciationTasksForLevel('B1')).toHaveLength(4);
    expect(pronunciationTasksForLevel('B2')).toHaveLength(4);
    expect(pronunciationTasksForLevel('C1')).toHaveLength(4);
    expect(advancedPronunciationTasks).toHaveLength(12);
  });
  it('moves from intelligibility/chunking toward discourse prosody and nuance',()=>{
    expect(pronunciationTasksForLevel('B1').some(item=>/chunk|stress|weak|link/i.test(item.focus))).toBe(true);
    expect(pronunciationTasksForLevel('B2').some(item=>/rhythm|intonation|connected|qualification/i.test(item.focus))).toBe(true);
    expect(pronunciationTasksForLevel('C1').some(item=>/nuance|professional|presentation|implication/i.test(item.focus))).toBe(true);
  });
  it('defines learner-facing coaching and success criteria for every task',()=>{
    for(const task of advancedPronunciationTasks){expect(task.target.length).toBeGreaterThan(10);expect(task.coaching.length).toBeGreaterThan(30);expect(task.success.length).toBeGreaterThanOrEqual(3);}
  });
});
