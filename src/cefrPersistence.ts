import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { SkillName } from './adaptiveLearning';
import type { LearningLevel } from './curriculumAll';
import { masteryFromEvidence, type CEFRSkillEvidence, type SkillMastery } from './cefrProgress';

export type SkillEvidenceInput = Omit<CEFRSkillEvidence, 'observedAt'> & {
  observedAt?: number;
  lessonId?: string;
  activityId?: string;
};

export async function recordSkillEvidence(uid: string, input: SkillEvidenceInput) {
  const observedAt = input.observedAt ?? Date.now();
  const evidence: CEFRSkillEvidence = {
    skill: input.skill,
    level: input.level,
    score: Math.max(0, Math.min(100, Math.round(input.score))),
    confidence: Math.max(0, Math.min(1, input.confidence)),
    source: input.source,
    observedAt,
  };
  const evidenceRef = doc(collection(db, 'users', uid, 'skillEvidence'));
  await setDoc(evidenceRef, {
    ...evidence,
    lessonId: input.lessonId || null,
    activityId: input.activityId || null,
    createdAt: serverTimestamp(),
  });

  const snap = await getDocs(collection(db, 'users', uid, 'skillEvidence'));
  const sameSkill = snap.docs
    .map(item => item.data() as CEFRSkillEvidence)
    .filter(item => item.skill === input.skill)
    .sort((a, b) => b.observedAt - a.observedAt)
    .slice(0, 12);
  const mastery = masteryFromEvidence(sameSkill);
  if (mastery) {
    await setDoc(doc(db, 'users', uid, 'mastery', input.skill), {
      skill: input.skill,
      ...mastery,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  return { evidence, mastery };
}

export async function loadSkillMastery(uid: string): Promise<Partial<Record<SkillName, SkillMastery>>> {
  const snap = await getDocs(collection(db, 'users', uid, 'mastery'));
  const result: Partial<Record<SkillName, SkillMastery>> = {};
  for (const item of snap.docs) {
    const data = item.data() as SkillMastery & { skill?: SkillName };
    const skill = data.skill || item.id as SkillName;
    result[skill] = {
      level: data.level,
      confidence: data.confidence,
      evidenceCount: data.evidenceCount,
      lastAssessedAt: data.lastAssessedAt,
    };
  }
  return result;
}

export async function savePlacementState(uid: string, input: {
  declaredLevel: LearningLevel;
  estimatedOverall: LearningLevel;
  currentCurriculumLevel: LearningLevel;
  confidence?: number;
}) {
  await setDoc(doc(db, 'users', uid), {
    stateVersion: 2,
    declaredLevel: input.declaredLevel,
    estimatedOverall: input.estimatedOverall,
    currentCurriculumLevel: input.currentCurriculumLevel,
    placementLevel: input.estimatedOverall,
    placementConfidence: input.confidence ?? null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
