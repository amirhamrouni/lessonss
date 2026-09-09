import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, Target } from 'lucide-react';
import { ChoiceButton, ETButton, LearningShell, PageTitle, ProgressBar, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { placementQuestions, scorePlacement } from './assessment';
import { chooseEntryLevel, normalizeLearningLevel } from './cefrProgress';
import { recordSkillEvidence, savePlacementState } from './cefrPersistence';
import { directionFor, normalizeLanguage } from './languageSupport';
import type { LearningLevel } from './curriculumAll';

type Profile = { nativeLanguage?:string; explanationLanguage?:string; interfaceLanguage?:string; declaredLevel?:string; cefrLevel?:string };
const supported: LearningLevel[] = ['A1','A2','B1','B2','C1'];
const clamp = (value:string):LearningLevel => supported.includes(value as LearningLevel) ? value as LearningLevel : value === 'C2' ? 'C1' : 'A1';

export default function AssessmentV2() {
  const nav = useNavigate();
  const [user,setUser] = useState<User|null>(null);
  const [profile,setProfile] = useState<Profile>({});
  const [loading,setLoading] = useState(true);
  const [loadError,setLoadError] = useState(false);
  const [index,setIndex] = useState(0);
  const [answers,setAnswers] = useState<Record<string,string>>({});
  const [busy,setBusy] = useState(false);
  const [saveError,setSaveError] = useState('');
  const [finished,setFinished] = useState(false);

  useEffect(()=>{
    let active=true;
    const unsubscribe=onAuthStateChanged(auth,async current=>{
      if(!active)return;
      setUser(current);setLoading(true);setLoadError(false);
      if(!current){setLoading(false);return;}
      try{const snap=await getDoc(doc(db,'users',current.uid));if(active)setProfile(snap.exists()?snap.data() as Profile:{});}catch{if(active)setLoadError(true);}finally{if(active)setLoading(false);}
    });
    return()=>{active=false;unsubscribe();};
  },[]);

  const language=normalizeLanguage(profile.explanationLanguage||profile.nativeLanguage||profile.interfaceLanguage||'English');
  const dir=directionFor(language);
  const ar=language==='Arabic';
  const question=placementQuestions[index];
  const result=useMemo(()=>finished?scorePlacement(answers):null,[finished,answers]);

  if(loading)return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="PLACEMENT" title={ar?'نجهّز اختبار تحديد المستوى…':'Preparing your placement screener…'}/></LearningShell>;
  if(!user)return <Navigate to="/welcome" replace/>;
  if(loadError)return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<AlertTriangle/>} tone="danger" title={ar?'تعذّر تحميل بياناتك':'Could not load your learner profile'} body={ar?'لم يتغير أي تقدم محفوظ.':'No saved progress was changed.'} action={<ETButton onClick={()=>window.location.reload()}>{ar?'حاول مرة أخرى':'Try again'}</ETButton>}/></LearningShell>;

  async function complete() {
    if(!user||busy)return;
    const scored=scorePlacement(answers);
    const estimated=clamp(scored.level);
    const declared=normalizeLearningLevel(profile.declaredLevel||profile.cefrLevel||estimated);
    const confidence=Math.max(0.45,Math.min(0.9,0.45+(scored.percent/100)*0.45));
    const entry=chooseEntryLevel({declaredLevel:declared,placementLevel:estimated,confidence});
    setBusy(true);setSaveError('');
    try{
      await savePlacementState(user.uid,{declaredLevel:declared,estimatedOverall:estimated,currentCurriculumLevel:entry,confidence});
      await setDoc(doc(db,'users',user.uid,'assessments',`quick-placement-${Date.now()}`),{type:'quick-placement-v2',result:{...scored,level:estimated,confidence},measuredSkills:['vocabulary','grammar','reading'],unmeasuredSkills:['listening','spoken_interaction','spoken_production','writing','pronunciation','mediation'],createdAt:serverTimestamp()});
      const skillMap=[['Vocabulary','vocabulary'],['Grammar','grammar'],['Reading','reading']] as const;
      await Promise.allSettled(skillMap.map(([legacy,skill])=>recordSkillEvidence(user.uid,{skill,level:clamp(scored.skillLevels[legacy]),score:scored.skillScores[legacy],confidence:0.6,source:'placement'})));
      setFinished(true);
    }catch{setSaveError(ar?'تعذّر حفظ النتيجة. إجاباتك مازالت هنا، حاول مرة أخرى.':'Could not save the result. Your answers are still here; try again.');}
    finally{setBusy(false);}
  }

  if(finished&&result){
    const estimated=clamp(result.level);
    return <LearningShell language={language} dir={dir} showDock={false} className="et-assessment-v2"><Surface className="et-complete-card" tone="blue"><CheckCircle2 className="et-complete-icon"/><span className="et-eyebrow">ESTIMATED CEFR PROFILE</span><h1>{estimated}</h1><strong>{result.percent}%</strong><p>{ar?'هذا اختبار سريع يقيس المفردات والقواعد والقراءة فقط. المحادثة والاستماع والكتابة تُقاس لاحقًا داخل المسار.':'This quick screener measures vocabulary, grammar and reading only. Speaking, listening and writing are measured later through real tasks.'}</p><div className="et-placement-skills">{Object.entries(result.skillScores).map(([skill,score])=><span key={skill}><b>{skill}</b>{score}%</span>)}</div><small>{ar?'النتيجة تقدير CEFR داخل English Twin وليست شهادة خارجية.':'This is an English Twin CEFR-aligned estimate, not an external certificate.'}</small><ETButton onClick={()=>nav('/learn')}>{ar?'افتح المسار المقترح':'Open recommended path'}</ETButton></Surface></LearningShell>;
  }

  const selected=answers[question.id]||'';
  const progress=Math.round(((index+1)/placementQuestions.length)*100);
  return <LearningShell language={language} dir={dir} showDock={false} className="et-assessment-v2">
    <ETButton variant="ghost" onClick={()=>nav('/practice')}><ArrowLeft/>{ar?'العودة للتدريب':'Back to practice'}</ETButton>
    <PageTitle eyebrow="QUICK PLACEMENT" title={ar?'تقدير نقطة البداية':'Estimate your starting point'} description={ar?'12 سؤالًا سريعًا للمفردات والقواعد والقراءة. ليس اختبار شهادة.':'A 12-question screener for vocabulary, grammar and reading. It is not a certification exam.'}/>
    <Surface className="et-assessment-progress"><div><Target/><b>{index+1} / {placementQuestions.length}</b><span>{question.level} · {question.skill}</span></div><ProgressBar value={progress}/></Surface>
    <Surface className="et-assessment-question"><h2 dir="ltr">{question.prompt}</h2><div className="et-choice-list" dir="ltr">{question.options.map(option=><ChoiceButton key={option} state={selected===option?'selected':'idle'} onClick={()=>{setAnswers(current=>({...current,[question.id]:option}));setSaveError('');}}>{option}</ChoiceButton>)}</div></Surface>
    {saveError?<p className="error" role="alert">{saveError}</p>:null}
    <ETButton className="et-full" disabled={!selected||busy} onClick={()=>{if(index<placementQuestions.length-1){setIndex(value=>value+1);return;}void complete();}}>{busy?(ar?'جارٍ حفظ التقدير…':'Saving estimate…'):index<placementQuestions.length-1?(ar?'التالي':'Next'):(ar?'احسب المستوى التقديري':'Calculate estimated level')}</ETButton>
  </LearningShell>;
}
