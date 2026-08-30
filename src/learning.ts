import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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
  return {lessonId,completed:true,correct,total,score} as LessonProgress;
}

export function summarizeProgress(progress:ProgressMap,totalLessons:number){
  const completed=Object.values(progress).filter(p=>p.completed);
  const average=completed.length?Math.round(completed.reduce((sum,p)=>sum+p.score,0)/completed.length):0;
  const percent=totalLessons?Math.round((completed.length/totalLessons)*100):0;
  return {completed:completed.length,total:totalLessons,average,percent};
}
