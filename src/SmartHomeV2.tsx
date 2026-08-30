import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { BookOpen, BrainCircuit, ChevronRight, Gauge, Home, Mic, RotateCcw, Settings, Sparkles, UserRound } from 'lucide-react';
import { auth, db } from './firebase';
import { lessons, lessonsForLevel } from './curriculumAll';
import { loadLessonProgress, ProgressMap, summarizeProgress } from './learning';
import { dueCards, ensureReviewCards } from './review';
import { buildDailyPlan, SkillLevels, weakestMeasuredSkill } from './adaptiveLearning';

type Profile = {
  displayName?: string;
  learningGoal?: string;
  dailyTargetMinutes?: number;
  onboardingCompleted?: boolean;
  beginnerFoundationCompleted?: boolean;
  nativeLanguage?: string;
  explanationLanguage?: string;
  interfaceLanguage?: string;
  placementLevel?: string;
  skillLevels?: Partial<SkillLevels>;
};
type Recommendation = { kind: 'foundation'|'assessment'|'review'|'lesson'|'speak'; eyebrow:string; title:string; body:string; action:string; to:string };

function Dock(){return <nav className="dock">{[['/',Home,'Home'],['/learn',BookOpen,'Learn'],['/practice',Gauge,'Practice'],['/speak',Mic,'Speak'],['/profile',UserRound,'Me']].map(([to,Icon,label]:any)=><NavLink end={to==='/'} key={to} to={to}><Icon/><small>{label}</small></NavLink>)}</nav>}

export default function SmartHomeV2(){
  const nav=useNavigate();
  const [user,setUser]=useState<User|null>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [progress,setProgress]=useState<ProgressMap>({});
  const [dueCount,setDueCount]=useState(0);
  const [loading,setLoading]=useState(true);

  useEffect(()=>onAuthStateChanged(auth,async current=>{
    setLoading(true);setUser(current);
    if(!current){setProfile(null);setProgress({});setDueCount(0);setLoading(false);return;}
    try{
      const [snap,p]=await Promise.all([getDoc(doc(db,'users',current.uid)),loadLessonProgress(current.uid)]);
      const next=snap.exists()?snap.data() as Profile:{};setProfile(next);setProgress(p);
      const completed=Object.values(p).filter(x=>x.completed).map(x=>x.lessonId);
      const cards=await ensureReviewCards(current.uid,completed);setDueCount(dueCards(cards).length);
    }catch{setDueCount(0)}finally{setLoading(false)}
  }),[]);

  const nextLesson=useMemo(()=>lessons.find(l=>!progress[l.id]?.completed),[progress]);
  const weakestSkill=useMemo(()=>weakestMeasuredSkill(profile?.skillLevels),[profile?.skillLevels]);
  const dailyPlan=useMemo(()=>buildDailyPlan({
    dailyTargetMinutes:profile?.dailyTargetMinutes||15,
    dueReviews:dueCount,
    nextLessonId:nextLesson?.id,
    weakestSkill,
    speakingAvailable:true,
  }),[profile?.dailyTargetMinutes,dueCount,nextLesson?.id,weakestSkill]);
  const a1Summary=useMemo(()=>summarizeProgress(progress,lessonsForLevel('A1').length),[progress]);
  const a2Summary=useMemo(()=>{
    const a2Ids=new Set(lessonsForLevel('A2').map(l=>l.id));
    const scoped=Object.fromEntries(Object.entries(progress).filter(([id])=>a2Ids.has(id)));
    return summarizeProgress(scoped,lessonsForLevel('A2').length);
  },[progress]);

  const recommendation:Recommendation=useMemo(()=>{
    if(!profile?.beginnerFoundationCompleted)return{kind:'foundation',eyebrow:'START HERE · A0 → A1',title:'See it. Hear it. Say it.',body:'Start with clear pictures, everyday words, pronunciation and tiny sentences. No grammar test first.',action:'Start first words',to:'/start'};
    const first=dailyPlan[0];
    if(first?.id==='review')return{kind:'review',eyebrow:'MEMORY PRIORITY',title:`${dueCount} review${dueCount===1?'':'s'} due now.`,body:first.reason,action:'Review now',to:'/review'};
    if(first?.id==='lesson'&&nextLesson)return{kind:'lesson',eyebrow:nextLesson.id.startsWith('a2-')?'A2 · NEXT BEST STEP':'A1 · NEXT BEST STEP',title:nextLesson.title,body:`${nextLesson.objective} · ${first.minutes} min today`,action:'Continue lesson',to:`/lesson/${nextLesson.id}`};
    return{kind:'speak',eyebrow:'TRANSFER TO SPEECH',title:'Use what you learned in conversation.',body:'Turn stored knowledge into real-time production.',action:'Open speaking lab',to:'/speak'};
  },[profile?.beginnerFoundationCompleted,dailyPlan,dueCount,nextLesson]);

  function planRoute(itemId:string,lessonId?:string){
    if(itemId==='review')return '/review';
    if(itemId==='lesson'&&lessonId)return `/lesson/${lessonId}`;
    if(itemId==='speaking')return '/speak';
    return '/practice';
  }

  if(loading)return <main className="center wake"><BrainCircuit/><p>Reading your learning state…</p></main>;
  if(!user)return <Navigate to="/welcome" replace/>;
  if(!profile?.onboardingCompleted || !profile?.nativeLanguage)return <Navigate to="/setup" replace/>;

  return <div className="app-shell"><div className="phone"><main className="page">
    <header className="home-header"><div><span className="eyebrow">ENGLISH TWIN · ADAPTIVE HOME</span><h1>{profile.displayName||user.displayName||'Learner'}</h1><p>{profile.learningGoal||'Personal English'} · {profile.dailyTargetMinutes||15} min daily</p></div><button className="icon" onClick={()=>nav('/profile')}><Settings/></button></header>
    <section className="twin-stage"><div className="twin-copy"><span className="status-dot">{recommendation.eyebrow}</span><h2>{recommendation.title}</h2><p>{recommendation.body}</p><div className="hero-actions"><button className="primary lime" onClick={()=>nav(recommendation.to)}>{recommendation.kind==='review'?<RotateCcw/>:recommendation.kind==='assessment'?<Gauge/>:recommendation.kind==='speak'?<Mic/>:<BookOpen/>}{recommendation.action}</button><button className="ghost" onClick={()=>nav('/twin')}>Ask your Twin <ChevronRight/></button></div></div><div className="twin idle"><div className="twin-aura"/><div className="twin-orbit orbit-a"/><div className="twin-orbit orbit-b"/><div className="twin-core"><span className="twin-eye left"/><span className="twin-eye right"/><i className="twin-mouth"/></div><div className="twin-wave"><i/><i/><i/><i/><i/></div></div></section>
    <section><div className="section-heading"><span>TODAY</span><h3>Your adaptive plan</h3></div><div className="daily-plan">{!profile.beginnerFoundationCompleted?<button onClick={()=>nav('/start')}><span className="plan-no">01</span><div><b>First words</b><small>Pictures · listening · pronunciation · meaning · tiny sentences</small></div><ChevronRight/></button>:dailyPlan.map((item,index)=><button key={`${item.id}-${index}`} onClick={()=>nav(planRoute(item.id,item.lessonId))}><span className="plan-no">{String(index+1).padStart(2,'0')}</span><div><b>{item.id==='review'?'Memory review':item.id==='lesson'?'Next lesson':item.id==='weak-skill'?`Strengthen ${item.skill}`:'Speaking transfer'}</b><small>{item.minutes} min · {item.reason}</small></div><ChevronRight/></button>)}</div></section>
    <section><div className="section-heading"><span>PATH</span><h3>A1 → A2 learning state</h3></div><div className="metric-strip"><div><strong>{a1Summary.percent}%</strong><span>A1</span></div><div><strong>{a2Summary.percent}%</strong><span>A2</span></div><div><strong>{dueCount}</strong><span>Reviews due</span></div></div></section>
    <section><div className="section-heading"><span>SIGNALS</span><h3>Choose your route</h3></div><div className="daily-plan"><button onClick={()=>nav('/start')}><span className="plan-no">01</span><div><b>Beginner start</b><small>{profile.beginnerFoundationCompleted?'Completed — repeat any time':'Recommended if you are starting from zero'}</small></div><ChevronRight/></button><button onClick={()=>nav('/assessment')}><span className="plan-no">02</span><div><b>Placement · optional</b><small>{profile.placementLevel?`Measured: ${profile.placementLevel}`:'Use this only if you already know some English'}</small></div><ChevronRight/></button><button onClick={()=>nav('/review')}><span className="plan-no">03</span><div><b>Memory</b><small>{dueCount?`${dueCount} cards due`:'No review due'}</small></div><ChevronRight/></button></div></section>
    {!Object.keys(progress).length&&<div className="signal-empty"><Sparkles/><div><b>No invented progress.</b><p>Your progress starts from real words and real activities, not a fake level score.</p></div></div>}
  </main><Dock/></div></div>;
}
