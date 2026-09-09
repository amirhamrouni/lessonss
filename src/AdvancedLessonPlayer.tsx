import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, Mic, RotateCcw, Square, Volume2 } from 'lucide-react';
import { ChoiceButton, ETButton, FeedbackBanner, LearningShell, ProgressBar, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import type { ActivityV2, ContentBlock, LessonV2, SourceBlock } from './curriculumV2';
import { aggregateStructuredEvaluation, runTextPreflight, type StructuredEvaluation } from './evaluation';
import { saveLessonCompletion } from './learning';
import { directionFor, normalizeLanguage } from './languageSupport';
import { prioritizeReviewFromMistake } from './review';

type LearnerProfile = { nativeLanguage?: string; explanationLanguage?: string; interfaceLanguage?: string };
type Feedback = { ok: boolean; title: string; text: string; percent?: number };
type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; 0: RecognitionAlternative };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
type RecognitionLike = { lang:string; interimResults:boolean; continuous:boolean; start:()=>void; stop:()=>void; onresult:((event:RecognitionEvent)=>void)|null; onerror:((event:RecognitionErrorEvent)=>void)|null; onend:(()=>void)|null };
type RecognitionCtor = new () => RecognitionLike;

declare global { interface Window { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor } }

function blockText(block?: ContentBlock) { return block?.value || ''; }
function sourceTexts(activity: ActivityV2) {
  if ('sources' in activity && Array.isArray(activity.sources)) return activity.sources.map(source => blockText(source.content));
  if ('source' in activity && activity.source && typeof activity.source === 'object' && 'format' in activity.source) return [blockText(activity.source as ContentBlock)];
  if ('passage' in activity && activity.passage) return [blockText(activity.passage)];
  return [];
}
function sourceIds(activity: ActivityV2) { return 'sources' in activity && Array.isArray(activity.sources) ? activity.sources.map(source => source.id) : []; }
function requiredSourceIds(activity: ActivityV2) { return activity.type === 'paragraph_synthesis' ? activity.requiredSourceIds : []; }
function extractCitedSourceIds(activity: ActivityV2, response: string) { return sourceIds(activity).filter(id => response.toLowerCase().includes(id.toLowerCase())); }

function activityPrompt(activity: ActivityV2) {
  if ('prompt' in activity && typeof activity.prompt === 'string') return activity.prompt;
  if (activity.type === 'lexical_item') return `Use “${activity.term}” in your own example.`;
  if (activity.type === 'error_correction') return activity.prompt;
  if (activity.type === 'roleplay') return activity.scenario;
  if (activity.type === 'open_speaking') return activity.prompt;
  if (activity.type === 'presentation') return activity.topic;
  if (activity.type === 'argument_builder') return activity.proposition;
  return blockText(activity.instruction);
}

function textRange(activity: ActivityV2) {
  if ('minimumWords' in activity && typeof activity.minimumWords === 'number') return { min: activity.minimumWords, max: 'maximumWords' in activity && typeof activity.maximumWords === 'number' ? activity.maximumWords : undefined };
  if (activity.type === 'critical_reading') return { min: activity.response.minimumWords, max: activity.response.maximumWords };
  if (activity.evaluation.mode === 'hybrid') return { min: activity.evaluation.minimumWords, max: activity.evaluation.maximumWords };
  return { min: undefined, max: undefined };
}

function isPassive(activity: ActivityV2) { return activity.type === 'lexical_item'; }
function isSpeechActivity(activity: ActivityV2) { return activity.type === 'open_speaking' || activity.type === 'roleplay' || activity.type === 'presentation'; }
function isOpenResponse(activity: ActivityV2) {
  return ['critical_reading','paraphrase','guided_writing','free_writing','paragraph_synthesis','summarization','argument_builder','roleplay','open_speaking','mediation','source_comparison','presentation'].includes(activity.type);
}
function isObjective(activity: ActivityV2) {
  return ['extended_reading','reading_inference','listening_comprehension','dictation','collocation','error_correction'].includes(activity.type);
}

function objectivePrompt(activity: ActivityV2) {
  if (activity.type === 'extended_reading' || activity.type === 'listening_comprehension') return activity.questions[0]?.prompt || '';
  if (activity.type === 'reading_inference') return activity.prompt;
  if (activity.type === 'dictation') return 'Type exactly what you hear.';
  if (activity.type === 'collocation') return activity.prompt;
  if (activity.type === 'error_correction') return activity.prompt;
  return '';
}
function objectiveOptions(activity: ActivityV2) {
  if (activity.type === 'extended_reading' || activity.type === 'listening_comprehension') return activity.questions[0]?.options || [];
  if (activity.type === 'reading_inference' || activity.type === 'collocation') return activity.options;
  return [];
}
function objectiveExpected(activity: ActivityV2) {
  if (activity.type === 'extended_reading' || activity.type === 'listening_comprehension') return activity.questions[0]?.answer || '';
  if (activity.type === 'reading_inference' || activity.type === 'collocation' || activity.type === 'dictation' || activity.type === 'error_correction') return activity.answer;
  return '';
}
function objectiveExplanation(activity: ActivityV2) {
  if (activity.type === 'extended_reading' || activity.type === 'listening_comprehension') return activity.questions[0]?.explanation || '';
  if (activity.type === 'reading_inference' || activity.type === 'collocation' || activity.type === 'error_correction') return activity.explanation;
  return '';
}
function normalize(value: string) { return value.trim().toLowerCase().replace(/[.!?]+$/g,'').replace(/\s+/g,' '); }

function speakEnglish(text: string, rate = 0.82) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

function SourceCards({ sources }: { sources: SourceBlock[] }) {
  return <div className="et-advanced-sources">{sources.map(source => <Surface key={source.id} className="et-source-card"><span className="et-eyebrow">{source.id}{source.title ? ` · ${source.title}` : ''}</span><p dir="ltr">{blockText(source.content)}</p></Surface>)}</div>;
}

function AdvancedActivity({ activity, selected, setSelected, draft, setDraft, locked, listening, startListening, stopListening }: {
  activity: ActivityV2;
  selected: string;
  setSelected: (value:string)=>void;
  draft: string;
  setDraft: (value:string)=>void;
  locked: boolean;
  listening: boolean;
  startListening: ()=>void;
  stopListening: ()=>void;
}) {
  const options = objectiveOptions(activity);
  const range = textRange(activity);
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  if (activity.type === 'lexical_item') return <div className="et-activity et-advanced-lexical"><span className="et-eyebrow">{activity.lexicalKind.replaceAll('_',' ').toUpperCase()}</span><h2 dir="ltr">{activity.term}</h2><p>{activity.definition}</p><div className="et-example-line" dir="ltr">{activity.example}</div><ETButton variant="secondary" onClick={() => speakEnglish(`${activity.term}. ${activity.example}`)}><Volume2 /> Hear in context</ETButton></div>;

  if (activity.type === 'listening_comprehension' || activity.type === 'dictation') return <div className="et-activity"><span className="et-eyebrow">LISTENING</span><h2>{objectivePrompt(activity)}</h2><button type="button" className="et-audio-control" onClick={() => speakEnglish(activity.audioText,0.78)}><Volume2/><span>Play audio</span></button>{options.length ? <div className="et-choice-list">{options.map(option => <ChoiceButton disabled={locked} state={selected === option ? 'selected' : 'idle'} key={option} onClick={() => setSelected(option)}>{option}</ChoiceButton>)}</div> : <textarea className="et-lesson-textarea" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Type what you hear…"/>}</div>;

  if (activity.type === 'extended_reading' || activity.type === 'reading_inference') return <div className="et-activity"><span className="et-eyebrow">READING</span><Surface className="et-reading-passage"><p dir="ltr">{blockText(activity.passage)}</p></Surface><h2>{objectivePrompt(activity)}</h2><div className="et-choice-list">{options.map(option => <ChoiceButton disabled={locked} state={selected === option ? 'selected' : 'idle'} key={option} onClick={() => setSelected(option)}>{option}</ChoiceButton>)}</div></div>;

  if (activity.type === 'error_correction') return <div className="et-activity"><span className="et-eyebrow">LANGUAGE CONTROL</span><h2>{activity.prompt}</h2><Surface className="et-reading-passage"><p dir="ltr">{activity.sentence}</p></Surface><textarea className="et-lesson-textarea" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Write the corrected sentence…"/></div>;

  if (activity.type === 'collocation') return <div className="et-activity"><span className="et-eyebrow">COLLOCATION</span><h2>{activity.prompt}</h2><div className="et-choice-list">{activity.options.map(option => <ChoiceButton disabled={locked} state={selected===option?'selected':'idle'} key={option} onClick={()=>setSelected(option)}>{option}</ChoiceButton>)}</div></div>;

  if (activity.type === 'critical_reading') return <div className="et-activity"><span className="et-eyebrow">CRITICAL READING</span><Surface className="et-reading-passage"><p dir="ltr">{blockText(activity.source)}</p></Surface><h2>{activity.prompt}</h2><textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;

  if (activity.type === 'paragraph_synthesis' || activity.type === 'mediation' || activity.type === 'source_comparison') return <div className="et-activity"><span className="et-eyebrow">{activity.type.replaceAll('_',' ').toUpperCase()}</span><SourceCards sources={activity.sources}/><h2>{activity.prompt}</h2><textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;

  if (activity.type === 'summarization') return <div className="et-activity"><span className="et-eyebrow">SUMMARY</span><Surface className="et-reading-passage"><p dir="ltr">{blockText(activity.source)}</p></Surface><h2>{activity.prompt}</h2><textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;

  if (activity.type === 'paraphrase') return <div className="et-activity"><span className="et-eyebrow">PARAPHRASE</span><Surface className="et-reading-passage"><p dir="ltr">{activity.sourceText}</p></Surface><h2>{blockText(activity.instruction)}</h2>{activity.constraints?.length ? <ul>{activity.constraints.map(item=><li key={item}>{item}</li>)}</ul> : null}<textarea className="et-lesson-textarea" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;

  if (activity.type === 'guided_writing' || activity.type === 'free_writing') return <div className="et-activity"><span className="et-eyebrow">WRITING · {activity.level}</span><h2>{activity.prompt}</h2>{activity.type === 'guided_writing' ? <div className="et-writing-scaffold">{activity.scaffolds.map(item=><span key={item}>{item}</span>)}</div> : null}{activity.audience ? <p><b>Audience:</b> {activity.audience}</p> : null}{activity.register ? <p><b>Register:</b> {activity.register}</p> : null}<textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;

  if (activity.type === 'argument_builder') return <div className="et-activity"><span className="et-eyebrow">ARGUMENT</span><h2>{activity.proposition}</h2><div className="et-writing-scaffold">{activity.requiredParts.map(item=><span key={item}>{item.replaceAll('_',' ')}</span>)}</div><textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;

  if (isSpeechActivity(activity)) return <div className="et-activity"><span className="et-eyebrow">SPEAKING · {activity.level}</span><h2>{activityPrompt(activity)}</h2>{activity.type === 'roleplay' ? <><p><b>Your role:</b> {activity.learnerRole}</p><p><b>Other person:</b> {activity.counterpartRole}</p></> : null}{activity.type === 'presentation' ? <div className="et-writing-scaffold">{activity.outlineRequirements.map(item=><span key={item}>{item}</span>)}</div> : null}<div className="et-inline-actions"><ETButton disabled={locked || listening} onClick={startListening}><Mic/> {listening ? 'Listening…' : 'Start speaking'}</ETButton>{listening ? <ETButton variant="secondary" onClick={stopListening}><Square/> Stop</ETButton> : null}</div><textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked || listening} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Your transcript appears here. You can correct recognition errors before evaluation."/><small>{'successCriteria' in activity ? activity.successCriteria.join(' · ') : ''}</small></div>;

  return <div className="et-activity"><span className="et-eyebrow">ADVANCED TASK</span><h2>{activityPrompt(activity)}</h2><textarea className="et-lesson-textarea et-long-response" dir="ltr" disabled={locked} value={draft} onChange={event=>setDraft(event.target.value)} /></div>;
}

export default function AdvancedLessonPlayer({ lesson }: { lesson: LessonV2 }) {
  const nav = useNavigate();
  const [user,setUser] = useState<User|null>(null);
  const [profile,setProfile] = useState<LearnerProfile>({});
  const [loading,setLoading] = useState(true);
  const [loadError,setLoadError] = useState(false);
  const [index,setIndex] = useState(0);
  const [selected,setSelected] = useState('');
  const [draft,setDraft] = useState('');
  const [feedback,setFeedback] = useState<Feedback|null>(null);
  const [scores,setScores] = useState<Record<number,number>>({});
  const [saving,setSaving] = useState(false);
  const [saveError,setSaveError] = useState('');
  const [finished,setFinished] = useState(false);
  const [listening,setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike|null>(null);
  const activity = lesson.activities[index];
  const attemptId = `${lesson.id}-${activity.id}`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async current => {
      setUser(current); setLoading(true); setLoadError(false);
      if (!current) { setLoading(false); return; }
      try { const snap = await getDoc(doc(db,'users',current.uid)); setProfile(snap.exists()?snap.data() as LearnerProfile:{}); }
      catch { setLoadError(true); }
      finally { setLoading(false); }
    });
    return unsubscribe;
  },[]);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } },[]);

  useEffect(() => {
    if (!user || !isOpenResponse(activity)) return;
    let active = true;
    void getDoc(doc(db,'users',user.uid,'writingResponses',attemptId)).then(snap => {
      if (!active || !snap.exists()) return;
      const data = snap.data() as { text?:string; status?:string };
      if (data.status === 'draft' && data.text) setDraft(data.text);
    }).catch(()=>undefined);
    return () => { active = false; };
  },[user,attemptId,activity]);

  useEffect(() => {
    if (!user || !isOpenResponse(activity) || !draft.trim() || feedback) return;
    const timer = window.setTimeout(() => {
      void setDoc(doc(db,'users',user.uid,'writingResponses',attemptId), {
        attemptId, lessonId:lesson.id, activityId:activity.id, level:lesson.level, text:draft, wordCount:draft.trim().split(/\s+/).length, status:'draft', schemaVersion:2, contentVersion:lesson.contentVersion, updatedAt:serverTimestamp(),
      }, { merge:true }).catch(()=>undefined);
    },800);
    return () => window.clearTimeout(timer);
  },[user,draft,feedback,attemptId,activity,lesson]);

  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const dir = directionFor(language);
  const ar = language === 'Arabic';
  const progress = Math.round(((index + (finished?1:0))/lesson.activities.length)*100);
  const range = textRange(activity);
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  function resetAttempt() { setFeedback(null); setSelected(''); setDraft(''); setSaveError(''); }
  function nextActivity() { setFeedback(null); setSelected(''); setDraft(''); setSaveError(''); setIndex(value=>Math.min(value+1,lesson.activities.length-1)); }
  function recordScore(ok:boolean, percent=ok?100:0) { setScores(current=>({...current,[index]:percent})); }

  async function rememberMistake(original:string, corrected:string, reason:string, errorCode='advanced.task') {
    if (!user) return;
    await Promise.allSettled([
      setDoc(doc(db,'users',user.uid,'mistakes',`${lesson.id}-${activity.id}-${errorCode.replace(/[^a-z0-9]+/gi,'-')}`), { lessonId:lesson.id, activityId:activity.id, skill:lesson.primarySkill, original, corrected, reason, errorCode, rubricDimension:errorCode.split('.')[0], latestExample:activityPrompt(activity), timesSeen:increment(1), lastSeenAt:serverTimestamp(), source:'advanced-lesson', status:'active', schemaVersion:2 }, {merge:true}),
      prioritizeReviewFromMistake(user.uid,lesson.id,`${original} ${corrected} ${reason}`).catch(()=>[]),
    ]);
  }

  async function finishLesson(nextScores = scores) {
    if (!user || saving) return;
    setSaving(true); setSaveError('');
    const values = Object.values(nextScores);
    const total = values.length;
    const correct = values.filter(value=>value>=lesson.assessment.masteryThreshold).length;
    try { await saveLessonCompletion(user.uid,lesson.id,correct,total || 1); setFinished(true); }
    catch { setSaveError(ar?'تعذّر حفظ إكمال الدرس. حاول مرة أخرى.':'Could not save lesson completion. Try again.'); }
    finally { setSaving(false); }
  }

  async function completeCurrent(ok:boolean, text:string, percent=ok?100:0) {
    const nextScores = {...scores,[index]:percent};
    setScores(nextScores); setFeedback({ok,title:ok?'Ready to continue':'Try this task again',text,percent});
    if (ok && index === lesson.activities.length-1) await finishLesson(nextScores);
  }

  async function checkObjective() {
    const response = objectiveOptions(activity).length ? selected : draft;
    if (!response.trim()) return;
    const expected = objectiveExpected(activity);
    const ok = normalize(response) === normalize(expected);
    if (!ok) await rememberMistake(response,expected,objectiveExplanation(activity),'accuracy.objective');
    await completeCurrent(ok,objectiveExplanation(activity) || (ok?'Correct.':'Review the target and try again.'));
  }

  async function evaluateOpen() {
    if (!user || !draft.trim() || saving) return;
    const cited = extractCitedSourceIds(activity,draft);
    const preflight = runTextPreflight({ text:draft, minimumWords:range.min, maximumWords:range.max, sourceTexts:sourceTexts(activity), requiredSourceIds:requiredSourceIds(activity), citedSourceIds:cited });
    if (!preflight.ok) {
      const labels:Record<string,string>={empty:'Write a response first.',too_short:`Add more detail. Current word count: ${preflight.wordCount}.`,too_long:`Shorten the response. Current word count: ${preflight.wordCount}.`,missing_source_reference:'Reference every required source ID in your synthesis.',possible_source_copy:'Too much source wording appears to be copied directly. Paraphrase before submitting.'};
      setSaveError(preflight.errors.map(item=>labels[item]).join(' ')); return;
    }
    setSaving(true); setSaveError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({ taskId:activity.id, attemptId, lessonId:lesson.id, level:lesson.level, activityType:activity.type, rubricId:activity.evaluation.mode==='deterministic'?'deterministic':activity.evaluation.rubricId, rubricVersion:activity.evaluation.mode==='deterministic'?'1':activity.evaluation.rubricVersion||'1', prompt:activityPrompt(activity), learnerResponse:draft, sourceTexts:sourceTexts(activity), sourceIds:sourceIds(activity), citedSourceIds:cited, successCriteria:'successCriteria' in activity?activity.successCriteria:[], minimumWords:range.min, maximumWords:range.max })});
      const payload = await response.json() as { error?:string; evaluation?:StructuredEvaluation; aggregate?:{percent:number;passed:boolean} };
      if (!response.ok || !payload.evaluation || !payload.aggregate) throw new Error(payload.error || 'Evaluation unavailable');
      const localAggregate = aggregateStructuredEvaluation(payload.evaluation,lesson.assessment.masteryThreshold);
      const passed = localAggregate.passed;
      await Promise.all([
        setDoc(doc(db,'users',user.uid,'attempts',attemptId), { attemptId,lessonId:lesson.id,activityId:activity.id,activityType:activity.type,level:lesson.level,response:draft,status:'evaluated',score:localAggregate.percent,schemaVersion:2,contentVersion:lesson.contentVersion,submittedAt:serverTimestamp(),updatedAt:serverTimestamp() },{merge:true}),
        setDoc(doc(db,'users',user.uid,'evaluations',attemptId), { ...payload.evaluation, aggregate:localAggregate, lessonId:lesson.id,activityId:activity.id,updatedAt:serverTimestamp() },{merge:true}),
        setDoc(doc(db,'users',user.uid,'writingResponses',attemptId), { text:draft,status:'submitted',score:localAggregate.percent,submittedAt:serverTimestamp(),updatedAt:serverTimestamp() },{merge:true}),
      ]);
      for (const target of payload.evaluation.remediationTargets.slice(0,3)) await rememberMistake(draft.slice(0,500),'',`Needs reinforcement: ${target.code}`,target.code);
      const weakest = Object.entries(localAggregate.dimensionPercents).sort((a,b)=>a[1]-b[1]).slice(0,2).map(([name,value])=>`${name}: ${value}%`).join(' · ');
      await completeCurrent(passed,passed?`Structured evaluation passed at ${localAggregate.percent}%. ${weakest}`:`Structured evaluation: ${localAggregate.percent}%. Strengthen ${weakest || 'the requested task'} and try again.`,localAggregate.percent);
    } catch (error) { setSaveError(error instanceof Error?error.message:'Evaluation unavailable. Your draft is still saved.'); }
    finally { setSaving(false); }
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setSaveError('Speech recognition is not available in this browser. You can type your response instead.'); return; }
    setSaveError(''); const recognition = new Recognition(); recognition.lang='en-US'; recognition.interimResults=true; recognition.continuous=true;
    recognition.onresult = event => { let text=''; for(let i=0;i<event.results.length;i+=1) text += `${event.results[i][0].transcript} `; setDraft(text.trim()); };
    recognition.onerror = event => { setSaveError(`Microphone error: ${event.error}`); setListening(false); };
    recognition.onend = () => setListening(false); recognitionRef.current=recognition; setListening(true); try { recognition.start(); } catch { setListening(false); setSaveError('Could not start speech recognition.'); }
  }
  function stopListening() { try { recognitionRef.current?.stop(); } catch { /* noop */ } setListening(false); }

  if (loading) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle/>} eyebrow="ENGLISH TWIN" title={ar?'نحمّل الدرس المتقدم…':'Loading advanced lesson…'}/></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace/>;
  if (loadError) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<AlertTriangle/>} tone="danger" title={ar?'تعذّر تحميل ملفك':'Could not load your learner profile'} action={<ETButton onClick={()=>window.location.reload()}>{ar?'حاول مرة أخرى':'Try again'}</ETButton>}/></LearningShell>;

  if (finished) {
    const values=Object.values(scores); const average=values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):100;
    return <LearningShell language={language} dir={dir} showDock={false} className="et-lesson-shell"><Surface className="et-complete-card" tone="blue"><CheckCircle2 className="et-complete-icon"/><span className="et-eyebrow">{lesson.level} · {ar?'اكتمل الدرس':'LESSON COMPLETE'}</span><h1>{lesson.title}</h1><strong>{average}%</strong><p>{ar?'تم حفظ تقدمك وتقييماتك المنظمة.':'Your progress and structured evaluations have been saved.'}</p><ETButton onClick={()=>nav('/learn')}>{ar?'متابعة المسار':'Continue learning path'}</ETButton></Surface></LearningShell>;
  }

  const canSubmit = isPassive(activity) || (isObjective(activity) ? Boolean(selected || draft.trim()) : Boolean(draft.trim()));
  const action = feedback ? (feedback.ok ? (index===lesson.activities.length-1?'Finish':'Continue') : 'Try again') : isPassive(activity) ? 'Continue' : activity.evaluation.mode === 'deterministic' ? 'Check' : 'Evaluate';

  return <LearningShell language={language} dir={dir} showDock={false} className="et-lesson-shell et-advanced-lesson">
    <div className="et-lesson-header"><ETButton variant="ghost" onClick={()=>nav('/learn')} aria-label="Exit lesson"><ArrowLeft/></ETButton><ProgressBar value={progress}/><span dir="ltr">{index+1}/{lesson.activities.length}</span></div>
    <div className="et-lesson-context"><span>{lesson.level} · {lesson.primarySkill.replaceAll('_',' ')}</span><h1>{lesson.title}</h1><p>{lesson.canDo.map(item=>item.statement).join(' · ')}</p></div>
    <Surface className="et-activity-card"><AdvancedActivity activity={activity} selected={selected} setSelected={setSelected} draft={draft} setDraft={setDraft} locked={saving||Boolean(feedback)} listening={listening} startListening={startListening} stopListening={stopListening}/>{isOpenResponse(activity)&&range.min ? <div className="et-response-meta"><span>{wordCount} words</span><span>Target {range.min}{range.max?`–${range.max}`:''}</span><span>Autosaved</span></div> : null}</Surface>
    <div className={`et-lesson-footer ${feedback?(feedback.ok?'ok':'bad'):''}`} aria-busy={saving}>{feedback?<FeedbackBanner ok={feedback.ok} title={feedback.title}><p>{feedback.text}</p></FeedbackBanner>:null}{saveError?<p className="error" role="alert">{saveError}</p>:null}<div className="et-inline-actions">{feedback && !feedback.ok ? <ETButton variant="secondary" onClick={resetAttempt}><RotateCcw/> Try again</ETButton> : null}<ETButton className="et-full" disabled={saving||(!feedback&&!canSubmit)} onClick={()=>{ if(feedback?.ok){ if(index===lesson.activities.length-1) void finishLesson(); else nextActivity(); return; } if(feedback&&!feedback.ok){ resetAttempt(); return; } if(isPassive(activity)){ if(index===lesson.activities.length-1) void finishLesson(); else nextActivity(); return; } if(isObjective(activity)) void checkObjective(); else void evaluateOpen(); }}>{saving?'Working…':action}</ETButton></div></div>
  </LearningShell>;
}
