import { describe, expect, it } from 'vitest';
import { enabledLearningLevels, featureFlags, isLearningLevelEnabled } from './featureFlags';

describe('CEFR rollout flags',()=>{
  it('keeps legacy levels always available',()=>{expect(isLearningLevelEnabled('A1')).toBe(true);expect(isLearningLevelEnabled('A2')).toBe(true);});
  it('enables the approved advanced curriculum by default unless explicitly disabled',()=>{expect(featureFlags.curriculumV2).toBe(true);expect(enabledLearningLevels).toEqual(['A1','A2','B1','B2','C1']);});
});
