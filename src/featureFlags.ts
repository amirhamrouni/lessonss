import type { LearningLevel } from './curriculumAll';

export const featureFlags = {
  curriculumV2: import.meta.env.VITE_CURRICULUM_V2 !== 'false',
  b1: import.meta.env.VITE_ENABLE_B1 !== 'false',
  b2: import.meta.env.VITE_ENABLE_B2 !== 'false',
  c1: import.meta.env.VITE_ENABLE_C1 !== 'false',
  aiEvaluation: import.meta.env.VITE_AI_EVALUATION !== 'false',
} as const;

export function isLearningLevelEnabled(level: LearningLevel) {
  if (level === 'A1' || level === 'A2') return true;
  if (!featureFlags.curriculumV2) return false;
  if (level === 'B1') return featureFlags.b1;
  if (level === 'B2') return featureFlags.b2;
  return featureFlags.c1;
}

export const enabledLearningLevels: LearningLevel[] = (['A1','A2','B1','B2','C1'] as LearningLevel[]).filter(isLearningLevelEnabled);
