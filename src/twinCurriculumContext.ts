import { isLessonV2 } from './curriculumV2';
import { lessonsForLevel, type LearningLevel } from './curriculumAll';
import type { ProgressMap } from './learning';
import { normalizeLearningLevel } from './cefrProgress';

export type TwinCurriculumContext={
  level:LearningLevel;
  lessonId?:string;
  unitId?:string;
  unitTitle?:string;
  canDo:string[];
  targetFunctions:string[];
};

type Profile={currentCurriculumLevel?:string;placementLevel?:string;cefrLevel?:string};

function targetFunctionsForLesson(lesson:any):string[]{
  if(!isLessonV2(lesson))return [];
  const functions=new Set<string>();
  for(const activity of lesson.activities){
    if(activity.type==='roleplay')activity.successCriteria.forEach((item:string)=>functions.add(item));
    if(activity.type==='open_speaking')activity.successCriteria.forEach((item:string)=>functions.add(item));
    if(activity.type==='argument_builder')activity.requiredParts.forEach((item:string)=>functions.add(item.replaceAll('_',' ')));
    if(activity.type==='presentation')activity.successCriteria.forEach((item:string)=>functions.add(item));
  }
  return [...functions].slice(0,8);
}

export function buildTwinCurriculumContext(profile:Profile,progress:ProgressMap):TwinCurriculumContext{
  const level=normalizeLearningLevel(profile.currentCurriculumLevel||profile.placementLevel||profile.cefrLevel||'A1');
  const levelLessons=lessonsForLevel(level);
  const current=levelLessons.find(lesson=>!progress[lesson.id]?.completed)||levelLessons[levelLessons.length-1];
  if(!current)return{level,canDo:[],targetFunctions:[]};
  if(!isLessonV2(current))return{level,lessonId:current.id,unitId:current.unitId,canDo:[current.objective],targetFunctions:[]};
  return{
    level,
    lessonId:current.id,
    unitId:current.unitId,
    unitTitle:current.title,
    canDo:current.canDo.map(item=>item.statement).slice(0,6),
    targetFunctions:targetFunctionsForLesson(current),
  };
}
