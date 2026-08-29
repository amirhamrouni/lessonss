import { describe, expect, it } from 'vitest';
import { lessons, units } from './curriculum';
import { summarizeProgress } from './learning';

describe('curriculum integrity',()=>{
  it('has six A1 starter units and real lessons',()=>{
    expect(units).toHaveLength(6);
    expect(lessons.length).toBeGreaterThanOrEqual(13);
  });

  it('keeps unique lesson ids and valid unit references',()=>{
    const ids=lessons.map(l=>l.id);
    expect(new Set(ids).size).toBe(ids.length);
    const unitIds=new Set(units.map(u=>u.id));
    expect(lessons.every(l=>unitIds.has(l.unitId))).toBe(true);
    expect(lessons.every(l=>l.activities.length>=2)).toBe(true);
  });
});

describe('progress summary',()=>{
  it('uses only completed real lesson results',()=>{
    const summary=summarizeProgress({
      a:{lessonId:'a',completed:true,correct:3,total:4,score:75},
      b:{lessonId:'b',completed:true,correct:4,total:4,score:100},
      c:{lessonId:'c',completed:false,correct:0,total:0,score:0},
    },4);
    expect(summary.completed).toBe(2);
    expect(summary.average).toBe(88);
    expect(summary.percent).toBe(50);
  });

  it('returns zeroes when the learner has no progress',()=>{
    expect(summarizeProgress({},13)).toEqual({completed:0,total:13,average:0,percent:0});
  });
});
