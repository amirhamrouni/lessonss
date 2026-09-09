import type { LearningLevel } from './curriculumAll';
import type { SkillName, SkillLevels } from './adaptiveLearning';

export type CEFRSkillEvidence = {
  skill: SkillName;
  level: LearningLevel;
  score: number;
  confidence: number;
  source: 'placement' | 'lesson' | 'checkpoint' | 'speaking' | 'writing' | 'review';
  observedAt: number;
};

export type SkillMastery = {
  level: LearningLevel;
  confidence: number;
  evidenceCount: number;
  lastAssessedAt: number;
};

export type CEFRLearnerState = {
  stateVersion: 2;
  declaredLevel: LearningLevel;
  estimatedOverall: LearningLevel;
  currentCurriculumLevel: LearningLevel;
  skillLevels: SkillLevels;
  mastery: Partial<Record<SkillName, SkillMastery>>;
};

export type LegacyLearnerProfile = {
  cefrLevel?: string;
  placementLevel?: string;
  declaredLevel?: string;
  estimatedOverall?: string;
  currentCurriculumLevel?: string;
  skillLevels?: SkillLevels;
};

const levels: LearningLevel[] = ['A1','A2','B1','B2','C1'];
export const cefrRank: Record<LearningLevel, number> = { A1:1,A2:2,B1:3,B2:4,C1:5 };

export function normalizeLearningLevel(value?: string | null, fallback: LearningLevel = 'A1'): LearningLevel {
  const candidate = String(value || '').toUpperCase() as LearningLevel;
  return levels.includes(candidate) ? candidate : fallback;
}

export function defaultCEFRSkillLevels(level: LearningLevel): SkillLevels {
  return {
    vocabulary: level,
    grammar: level,
    reading: level,
    listening: level,
    speaking: level,
    spoken_interaction: level,
    spoken_production: level,
    writing: level,
    pronunciation: level,
    mediation: level,
  };
}

export function learnerStateFromProfile(profile: LegacyLearnerProfile): CEFRLearnerState {
  const declaredLevel = normalizeLearningLevel(profile.declaredLevel || profile.cefrLevel);
  const estimatedOverall = normalizeLearningLevel(profile.estimatedOverall || profile.placementLevel || profile.cefrLevel, declaredLevel);
  const currentCurriculumLevel = normalizeLearningLevel(profile.currentCurriculumLevel || profile.placementLevel || profile.cefrLevel, estimatedOverall);
  return {
    stateVersion: 2,
    declaredLevel,
    estimatedOverall,
    currentCurriculumLevel,
    skillLevels: { ...defaultCEFRSkillLevels(estimatedOverall), ...(profile.skillLevels || {}) },
    mastery: {},
  };
}

export function chooseEntryLevel(input: {
  declaredLevel?: string;
  placementLevel?: string;
  confidence?: number;
  fallback?: LearningLevel;
}): LearningLevel {
  const declared = normalizeLearningLevel(input.declaredLevel, input.fallback || 'A1');
  const measured = normalizeLearningLevel(input.placementLevel, declared);
  // A placement result should redirect the learner only when evidence is reasonably confident.
  if (typeof input.confidence === 'number' && input.confidence < 0.6) return declared;
  return measured;
}

export type RepairRecommendation = {
  needed: boolean;
  skill?: SkillName;
  learnerLevel?: LearningLevel;
  requiredLevel?: LearningLevel;
  repairLevel?: LearningLevel;
  reason?: string;
};

export function prerequisiteRepair(
  skillLevels: SkillLevels | undefined,
  skill: SkillName,
  requiredLevel: LearningLevel,
): RepairRecommendation {
  const observed = normalizeLearningLevel(skillLevels?.[skill], 'A1');
  if (cefrRank[observed] >= cefrRank[requiredLevel]) return { needed:false };
  return {
    needed:true,
    skill,
    learnerLevel:observed,
    requiredLevel,
    repairLevel:observed,
    reason:`Targeted ${skill} repair is needed before this task; the rest of the learner's curriculum level does not need to be reset.`,
  };
}

export function masteryFromEvidence(evidence: CEFRSkillEvidence[]): SkillMastery | null {
  if (!evidence.length) return null;
  const sorted = [...evidence].sort((a,b) => b.observedAt - a.observedAt);
  const weightedByLevel = new Map<LearningLevel,{weight:number;score:number}>();
  for (const item of sorted.slice(0,12)) {
    const reliability = Math.max(0.2, Math.min(1, item.confidence));
    const performance = Math.max(0, Math.min(100, item.score)) / 100;
    const weight = reliability * (0.5 + performance * 0.5);
    const bucket = weightedByLevel.get(item.level) || {weight:0,score:0};
    bucket.weight += weight;
    bucket.score += performance * weight;
    weightedByLevel.set(item.level,bucket);
  }
  let resolved: LearningLevel = 'A1';
  for (const level of levels) {
    const bucket = weightedByLevel.get(level);
    if (!bucket || bucket.weight < 0.9) continue;
    const average = bucket.score / bucket.weight;
    if (average >= 0.7) resolved = level;
  }
  const relevant = evidence.filter(item => item.level === resolved);
  const confidence = Math.min(1, relevant.reduce((sum,item)=>sum+item.confidence,0)/Math.max(2,relevant.length));
  return { level:resolved,confidence,evidenceCount:evidence.length,lastAssessedAt:Math.max(...evidence.map(item=>item.observedAt)) };
}

export function checkpointEligible(input: {
  targetLevel: LearningLevel;
  mastery: Partial<Record<SkillName,SkillMastery>>;
  minimumConfidence?: number;
}): { eligible:boolean; missing:SkillName[] } {
  const required: SkillName[] = ['reading','listening','spoken_interaction','spoken_production','writing','vocabulary','grammar'];
  if (cefrRank[input.targetLevel] >= cefrRank.B2) required.push('mediation');
  const minimumConfidence = input.minimumConfidence ?? 0.6;
  const missing = required.filter(skill => {
    const item = input.mastery[skill];
    return !item || cefrRank[item.level] < cefrRank[input.targetLevel] || item.confidence < minimumConfidence || item.evidenceCount < 2;
  });
  return { eligible:missing.length===0,missing };
}

export function nextLevel(level: LearningLevel): LearningLevel | null {
  const index = levels.indexOf(level);
  return index >= 0 && index < levels.length - 1 ? levels[index + 1] : null;
}
