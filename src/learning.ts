import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { lessonById } from './curriculumAll';
import { isLessonV2 } from './curriculumV2';
import { recordSkillEvidence } from './cefrPersistence';
import type { SkillName } from './adaptiveLearning';

export type LessonProgress={
  lessonId:string;
  completed:boolean;
  correct:number;
  total:number;
  score:number;
  completedAt?:unknown;
  updatedAt?:unknown;
};

export type ProgressMap=Record<string,LessonProgress>;

export async function loadLessonProgress(uid:string):Promise<ProgressMap>{
  const snap=await getDocs(collection(db,'users',uid,'lessonProgress'));
  const result:ProgressMap={};
  snap.forEach(d=>{result[d.id]=d.data() as LessonProgress});
  return result;
}

function evidenceSource(skill: SkillName) {
  if (skill === 'spoken_interaction' || skill === 'spoken_production' || skill === 'speaking' || skill === 'pronunciation') return 'speaking' as const;
  if (skill === 'writing' || skill === 'mediation') return 'writing' as const;
  return 'lesson' as const;
}

async function persistAdvancedEvidence(uid:string, lessonId:string, score:number) {
  let lesson;
  try { lesson = lessonById(lessonId); } catch { return; }
  if (!isLessonV2(lesson)) return;
  const uniqueSkills = [...new Set(lesson.skills)] as SkillName[];
  await Promise.allSettled(uniqueSkills.map(skill => recordSkillEvidence(uid, {
    skill,
    level: lesson.level,
    score,
    confidence: 0.75,
    source: evidenceSource(skill),
    lessonId,
  })));
}

export async function saveLessonCompletion(uid:string,lessonId:string,correct:number,total:number){
  const score=total>0?Math.round((correct/total)*100):100;
  const ref=doc(db,'users',uid,'lessonProgress',lessonId);
  await setDoc(ref,{
    lessonId,
    completed:true,
    correct,
    total,
    score,
    completedAt:serverTimestamp(),
    updatedAt:serverTimestamp(),
  },{merge:true});
  // Mastery evidence is additive and must never make historical lesson completion fail.
  await persistAdvancedEvidence(uid,lessonId,score).catch(()=>undefined);
  return {lessonId,completed:true,correct,total,score} as LessonProgress;
}

export function summarizeProgress(progress:ProgressMap,totalLessons:number){
  const completed=Object.values(progress).filter(p=>p.completed);
  const average=completed.length?Math.round(completed.reduce((sum,p)=>sum+p.score,0)/completed.length):0;
  const percent=totalLessons?Math.round((completed.length/totalLessons)*100):0;
  return {completed:completed.length,total:totalLessons,average,percent};
}
