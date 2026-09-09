import { describe, expect, it } from 'vitest';
import { checkpointEligible, chooseEntryLevel, defaultCEFRSkillLevels, learnerStateFromProfile, masteryFromEvidence, prerequisiteRepair } from './cefrProgress';

describe('CEFR learner progression', () => {
  it('keeps a confident advanced placement instead of forcing a learner through beginner history', () => {
    expect(chooseEntryLevel({ declaredLevel: 'B2', placementLevel: 'B2', confidence: 0.9 })).toBe('B2');
    expect(learnerStateFromProfile({ cefrLevel: 'C1', placementLevel: 'C1' }).currentCurriculumLevel).toBe('C1');
  });

  it('falls back to the declared level when placement confidence is weak', () => {
    expect(chooseEntryLevel({ declaredLevel: 'B1', placementLevel: 'C1', confidence: 0.4 })).toBe('B1');
  });

  it('recommends targeted prerequisite repair without resetting the whole curriculum level', () => {
    const levels = defaultCEFRSkillLevels('B2');
    levels.grammar = 'A2';
    const repair = prerequisiteRepair(levels, 'grammar', 'B1');
    expect(repair.needed).toBe(true);
    expect(repair.skill).toBe('grammar');
    expect(repair.learnerLevel).toBe('A2');
    expect(repair.requiredLevel).toBe('B1');
  });

  it('derives mastery from repeated skill evidence rather than lesson completion alone', () => {
    const now = Date.now();
    const mastery = masteryFromEvidence([
      { skill:'writing', level:'B2', score:78, confidence:0.9, source:'writing', observedAt:now - 1000 },
      { skill:'writing', level:'B2', score:82, confidence:0.9, source:'checkpoint', observedAt:now },
    ]);
    expect(mastery?.level).toBe('B2');
    expect(mastery?.evidenceCount).toBe(2);
  });

  it('requires mediation evidence for B2 and C1 checkpoints', () => {
    const complete:any = {};
    for (const skill of ['reading','listening','spoken_interaction','spoken_production','writing','vocabulary','grammar','mediation']) {
      complete[skill] = { level:'B2', confidence:0.8, evidenceCount:2, lastAssessedAt:Date.now() };
    }
    expect(checkpointEligible({ targetLevel:'B2', mastery:complete }).eligible).toBe(true);
    delete complete.mediation;
    const result = checkpointEligible({ targetLevel:'B2', mastery:complete });
    expect(result.eligible).toBe(false);
    expect(result.missing).toContain('mediation');
  });
});
