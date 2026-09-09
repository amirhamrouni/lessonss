import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, Mic, RotateCcw, Volume2 } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, ProgressBar, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { pronunciationTasksForLevel } from './advancedPronunciation';
import { normalizeLearningLevel } from './cefrProgress';
import { recordSkillEvidence } from './cefrPersistence';
import { directionFor, normalizeLanguage } from './languageSupport';
import { scoreSpokenAttempt, type SpeechScore } from './speakingEngine';
import type { LearningLevel } from './curriculumAll';

type Profile={nativeLanguage?:string;explanationLanguage?:string;interfaceLanguage?:string;currentCurriculumLevel?:string;placementLevel?:string;cefrLevel?:string};
type RecognitionAlternative={transcript:string};type RecognitionResult={isFinal:boolean;0:RecognitionAlternative};type RecognitionEvent={results:ArrayLike<RecognitionResult>};type RecognitionErrorEvent={error:string};type RecognitionLike={lang:string;interimResults:boolean;continuous:boolean;start:()=>void;stop:()=>void;onresult:((event:RecognitionEvent)=>void)|null;onerror:((event:RecognitionErrorEvent)=>void)|null;onend:(()=>void)|null};type RecognitionCtor=new()=>RecognitionLike;
declare global{interface Window{SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor}}

const CONSENT_KEY='english-twin-guided-speech-consent-v1';
function speak(text:string,rate=.84){if(typeof window==='undefined'||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=rate;window.speechSynthesis.speak(utterance);}

export default function AdvancedPronunciationLab({level}:{level:LearningLevel}){
  const nav=useNavigate();
  const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<Profile>({});const[loading,setLoading]=useState(true);const[loadError,setLoadError]=useState(false);const[index,setIndex]=useState(0);const[listening,setListening]=useState(false);const[transcript,setTranscript]=useState('');const[score,setScore]=useState<SpeechScore|null>(null);const[error,setError]=useState('');const[consent,setConsent]=useState(()=>localStorage.getItem(CONSENT_KEY)==='accepted');const[showConsent,setShowConsent]=useState(false);const recognitionRef=useRef<RecognitionLike|null>(null);
  const tasks=useMemo(()=>pronunciationTasksForLevel(level),[level]);const task=tasks[index%Math.max(tasks.length,1)];
  useEffect(()=>{let active=true;const unsub=onAuthStateChanged(auth,async current=>{if(!active)return;setUser(current);setLoading(true);setLoadError(false);if(!current){setLoading(false);return;}try{const snap=await getDoc(doc(db,'users',current.uid));if(active)setProfile(snap.exists()?snap.data() as Profile:{});}catch{if(active)setLoadError(true);}finally{if(active)setLoading(false);}});return()=>{active=false;unsub();};},[]);
  useEffect(()=>()=>{try{recognitionRef.current?.stop();}catch{/*noop*/}},[]);
  const language=normalizeLanguage(profile.explanationLanguage||profile.nativeLanguage||profile.interfaceLanguage||'English');const dir=directionFor(language);const ar=language==='Arabic';
  if(loading)return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="PRONUNCIATION" title={ar?'نجهّز تدريب النطق المتقدم…':'Preparing advanced pronunciation…'}/></LearningShell>;
  if(!user)return <Navigate to="/welcome" replace/>;
  if(loadError)return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<AlertTriangle/>} tone="danger" title={ar?'تعذّر تجهيز التدريب':'Could not prepare pronunciation practice'} body={ar?'لم تتغير بياناتك المحفوظة.':'Your saved learning data was not changed.'} action={<ETButton onClick={()=>window.location.reload()}>{ar?'حاول مرة أخرى':'Try again'}</ETButton>}/></LearningShell>;
  if(!task)return <Navigate to="/pronunciation" replace/>;

  function reset(){setTranscript('');setScore(null);setError('');}
  function start(){if(!consent){setShowConsent(true);return;}begin();}
  function accept(){localStorage.setItem(CONSENT_KEY,'accepted');setConsent(true);setShowConsent(false);begin();}
  function begin(){const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){setError(ar?'التعرّف على الكلام غير متوفر في هذا المتصفح.':'Speech recognition is not available in this browser.');return;}reset();const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=true;recognition.continuous=false;recognition.onresult=event=>{let text='';let final='';for(let i=0;i<event.results.length;i+=1){text+=`${event.results[i][0].transcript} `;if(event.results[i].isFinal)final+=`${event.results[i][0].transcript} `;}const heard=(final||text).trim();setTranscript(heard);if(final.trim()){const result=scoreSpokenAttempt(task.target,final.trim());setScore(result);void persistAttempt(result,final.trim());}};recognition.onerror=event=>{setListening(false);setError(`Microphone error: ${event.error}`);};recognition.onend=()=>setListening(false);recognitionRef.current=recognition;setListening(true);try{recognition.start();}catch{setListening(false);setError('Could not start speech recognition.');}}
  async function persistAttempt(result:SpeechScore,heard:string){if(!user)return;const id=`advanced-pronunciation-${task.id}`;await setDoc(doc(db,'users',user.uid,'mistakes',id),{skill:'pronunciation',original:heard,corrected:task.target,reason:result.accuracy>=70?'Intelligibility transcript matched the target; continue practising the prosody focus.':`Transcript match was below the intelligibility target. Focus: ${task.focus}.`,latestExample:task.target,timesSeen:increment(1),lastSeenAt:serverTimestamp(),source:'advanced-pronunciation',status:result.accuracy>=70?'monitor':'active',pronunciationTaskId:task.id,speechAccuracy:result.accuracy,level:task.level},{merge:true});if(result.accuracy>=70)await recordSkillEvidence(user.uid,{skill:'pronunciation',level:task.level,score:result.accuracy,confidence:.45,source:'speaking',activityId:task.id}).catch(()=>undefined);}
  function next(){reset();setIndex(value=>(value+1)%tasks.length);}
  const progress=Math.round(((index+1)/tasks.length)*100);
  return <LearningShell language={language} dir={dir} className="et-advanced-pronunciation">
    <ETButton variant="ghost" onClick={()=>nav('/practice')}><ArrowLeft/>{ar?'العودة للتدريب':'Back to practice'}</ETButton>
    <PageTitle eyebrow={`${level} · PRONUNCIATION`} title={ar?'النطق في الكلام المتصل':'Connected-speech pronunciation'} description={ar?'الهدف هو الوضوح والإيقاع والنبرة التي تخدم المعنى، وليس إزالة اللكنة.':'The goal is intelligibility, rhythm and meaning-focused prosody — not accent elimination.'}/>
    <Surface className="et-pronunciation-level-summary" tone="teal"><div><b>{index+1} / {tasks.length}</b><span>{task.focus}</span></div><ProgressBar value={progress}/></Surface>
    {showConsent?<Surface className="et-consent-card" role="dialog" aria-modal="true"><h2>{ar?'استخدام الميكروفون':'Microphone practice'}</h2><p>{ar?'سيستعمل المتصفح التعرّف على الكلام لكتابة ما سمعه.':'Browser speech recognition will transcribe what it hears for this practice.'}</p><div className="et-inline-actions"><ETButton variant="ghost" onClick={()=>setShowConsent(false)}>{ar?'ليس الآن':'Not now'}</ETButton><ETButton onClick={accept}>{ar?'أوافق وابدأ':'Accept and start'}</ETButton></div></Surface>:null}
    <Surface className="et-prosody-card"><span className="et-eyebrow">{task.focus}</span><h2 dir="ltr">{task.target}</h2><p>{task.coaching}</p><div className="et-writing-scaffold">{task.success.map(item=><span key={item}>{item}</span>)}</div><div className="et-inline-actions"><ETButton variant="secondary" onClick={()=>speak(task.listenText)}><Volume2/>Listen</ETButton><ETButton variant="secondary" onClick={()=>speak(task.listenText,.66)}><Volume2/>Slow</ETButton></div><button type="button" className={`et-mic-button ${listening?'listening':''}`} disabled={listening} onClick={start} aria-label={listening?'Listening':'Start speaking'}><Mic/></button></Surface>
    {transcript?<Surface className="et-transcript-card"><span className="et-eyebrow">TRANSCRIPT</span><p dir="ltr">{transcript}</p></Surface>:null}
    {score?<Surface className={`et-speech-score ${score.verdict}`}><div className="et-score-number"><strong>{score.accuracy}</strong><span>%</span></div><ProgressBar value={score.accuracy}/><p>{ar?'هذه النسبة تقيس مدى تطابق النص المسموع مع الجملة كبديل تقريبي للوضوح. لا تقيس النبرة أو الإيقاع صوتيًا.':'This score is a transcript-match proxy for intelligibility. It does not acoustically measure intonation, rhythm or accent.'}</p>{score.accuracy>=70?<ETButton onClick={next}><CheckCircle2/>Next focus</ETButton>:<ETButton onClick={start}><RotateCcw/>Try again</ETButton>}</Surface>:null}
    {error?<p className="error" role="alert">{error}</p>:null}
    <Surface className="et-checkpoint-policy"><b>{ar?'سياسة التقييم':'Measurement policy'}</b><p>{ar?'توجيهات النبرة والإيقاع هنا تدريبية. لا ننسب للتطبيق قياسًا صوتيًا غير موجود.':'Prosody and rhythm cues are coached, not falsely scored. Only transcript-based intelligibility is measured by this browser flow.'}</p></Surface>
  </LearningShell>;
}
