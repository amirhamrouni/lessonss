import { describe, expect, it } from 'vitest';
import { buildTwinCurriculumContext } from './twinCurriculumContext';

describe('Twin curriculum context',()=>{
  it('targets the first incomplete advanced lesson at the learner current level',()=>{
    const context=buildTwinCurriculumContext({currentCurriculumLevel:'B2'},{});
    expect(context.level).toBe('B2');
    expect(context.lessonId?.startsWith('b2-')).toBe(true);
    expect(context.canDo.length).toBeGreaterThan(0);
  });
  it('moves context to the next incomplete lesson after progress',()=>{
    const first=buildTwinCurriculumContext({currentCurriculumLevel:'B1'},{});
    const progress:any={};
    progress[first.lessonId!]={lessonId:first.lessonId,completed:true,correct:1,total:1,score:100};
    const next=buildTwinCurriculumContext({currentCurriculumLevel:'B1'},progress);
    expect(next.lessonId).not.toBe(first.lessonId);
    expect(next.level).toBe('B1');
  });
  it('exposes communicative functions for advanced speaking tasks when relevant',()=>{
    const progress:any={};
    // Complete the first three lessons so lesson 4 (speaking) becomes the current target.
    for(const id of ['b2-u1-l1','b2-u1-l2','b2-u1-l3'])progress[id]={lessonId:id,completed:true,correct:1,total:1,score:100};
    const context=buildTwinCurriculumContext({currentCurriculumLevel:'B2'},progress);
    expect(context.lessonId).toBe('b2-u1-l4');
    expect(context.targetFunctions.length).toBeGreaterThan(0);
  });
});
