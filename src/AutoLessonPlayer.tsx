import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, CheckCircle2, Languages, LoaderCircle, RotateCcw, Volume2 } from 'lucide-react';
import { ChoiceButton, ETButton, FeedbackBanner, LanguagePair, LearningShell, ProgressBar, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { Activity, Lesson, lessonById } from './curriculumAll';
import type { RichActivity } from './richLesson';
import { loadLessonProgress, ProgressMap, saveLessonCompletion } from './learning';
import { directionFor, normalizeLanguage, t } from './languageSupport';
import { prioritizeReviewFromMistake } from './review';

type LearnerProfile = { nativeLanguage?: string; explanationLanguage?: string; interfaceLanguage?: string };
type Feedback = { ok: boolean; text: string };
type AnyActivity = Activity | RichActivity;

function speakEnglish(text: string, rate = 0.82) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

function Visual({ visualId, label }: { visualId: 'hello' | 'water' | 'apple' | 'home'; label: string }) {
  return <svg className="et-lesson-visual" viewBox="0 0 320 220" role="img" aria-label={label}><use href={`/lesson-visuals/basic.svg#${visualId}`} /></svg>;
}

function choiceState(selected: boolean, feedback: Feedback | null) {
  if (!selected) return 'idle' as const;
  if (!feedback) return 'selected' as const;
  return feedback.ok ? 'correct' as const : 'wrong' as const;
}

function renderActivity(
  activity: AnyActivity,
  selected: string,
  setSelected: (value: string) => void,
  fill: string,
  setFill: (value: string) => void,
  supportLanguage: string,
  locked: boolean,
  feedback: Feedback | null,
) {
  const dir = directionFor(supportLanguage);
  const ar = supportLanguage === 'Arabic';

  if (activity.type === 'visual_word') {
    const meaning = activity.meanings[supportLanguage] || activity.meanings.English || activity.word;
    return <div className="et-activity et-word-activity">
      <span className="et-eyebrow" dir={dir}>{ar ? 'شاهد · اسمع · افهم' : 'SEE · HEAR · UNDERSTAND'}</span>
      <Visual visualId={activity.visualId} label={activity.word} />
      <LanguagePair english={<>{activity.word}<small className="et-phonetic">{activity.phonetic}</small></>} support={meaning} supportLabel={ar ? 'المعنى' : 'Meaning'} />
      <ETButton variant="secondary" type="button" onClick={() => speakEnglish(activity.word)}><Volume2 /> {ar ? 'اسمع الكلمة' : 'Hear the word'}</ETButton>
      <div className="et-example-line" dir="ltr">{activity.example}</div>
    </div>;
  }

  if (activity.type === 'listen_select') return <div className="et-activity">
    <span className="et-eyebrow" dir={dir}>{ar ? 'استماع' : 'LISTEN'}</span>
    <h2>{activity.prompt}</h2>
    <button className="et-audio-control" type="button" onClick={() => speakEnglish(activity.audioText, 0.72)}><Volume2 /><span>{ar ? 'تشغيل الصوت' : 'Play audio'}</span></button>
    <div className="et-choice-list" dir="ltr">{activity.options.map(option => <ChoiceButton disabled={locked} state={choiceState(selected === option, selected === option ? feedback : null)} key={option} onClick={() => setSelected(option)}>{option}</ChoiceButton>)}</div>
  </div>;

  if (activity.type === 'image_choice') return <div className="et-activity">
    <span className="et-eyebrow" dir={dir}>{ar ? 'صورة + كلمة' : 'PICTURE MATCH'}</span>
    <h2>{activity.prompt}</h2>
    <div className="et-image-choice-grid">{activity.options.map(option => <ChoiceButton disabled={locked} state={choiceState(selected === option.label, selected === option.label ? feedback : null)} className="et-image-choice" key={option.label} onClick={() => setSelected(option.label)}><Visual visualId={option.visualId} label={option.label} /><b>{option.label}</b></ChoiceButton>)}</div>
  </div>;

  if (activity.type === 'sentence_build') return <div className="et-activity">
    <span className="et-eyebrow" dir={dir}>{ar ? 'رتّب الجملة' : 'BUILD THE SENTENCE'}</span>
    <h2>{activity.prompt}</h2>
    <div className="et-built-sentence" dir="ltr">{selected || (ar ? 'ابنِ الجملة من الكلمات أدناه' : 'Build the sentence from the words below')}</div>
    <div className="et-word-bank" dir="ltr">{activity.words.map((word, index) => <button disabled={locked} type="button" key={`${word}-${index}`} onClick={() => setSelected(selected ? `${selected} ${word}` : word)}>{word}</button>)}</div>
    {selected && !locked ? <ETButton variant="ghost" type="button" onClick={() => setSelected('')}><RotateCcw /> {ar ? 'ابدأ من جديد' : 'Reset'}</ETButton> : null}
  </div>;

  if (activity.type === 'explain') return <div className="et-activity et-explain">
    <span className="et-eyebrow" dir={dir}>{t(supportLanguage, 'learn')}</span>
    <div className="et-native-instruction" dir={dir}>{t(supportLanguage, 'nativeQuestion')}</div>
    <h2>{activity.title}</h2>
    <p>{activity.body}</p>
    <div className="et-example-stack" dir="ltr">{activity.examples.map(example => <div key={example}>{example}</div>)}</div>
  </div>;

  if (activity.type === 'choice') return <div className="et-activity">
    <span className="et-eyebrow" dir={dir}>{t(supportLanguage, 'choose')}</span>
    <div className="et-native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div>
    <h2>{activity.prompt}</h2>
    <div className="et-choice-list" dir="ltr">{activity.options.map(option => <ChoiceButton disabled={locked} state={choiceState(selected === option, selected === option ? feedback : null)} key={option} onClick={() => setSelected(option)}>{option}</ChoiceButton>)}</div>
  </div>;

  return <div className="et-activity">
    <span className="et-eyebrow" dir={dir}>{t(supportLanguage, 'fill')}</span>
    <div className="et-native-instruction" dir={dir}>{t(supportLanguage, 'target')}</div>
    <h2>{activity.prompt}</h2>
    <input disabled={locked} className="et-lesson-input" dir="ltr" value={fill} onChange={event => setFill(event.target.value)} placeholder={activity.hint || t(supportLanguage, 'hint')} />
  </div>;
}

function isPassive(activity: AnyActivity) {
  return activity.type === 'explain' || activity.type === 'visual_word';
}

function activityAnswer(activity: AnyActivity, selected: string, fill: string) {
  if (activity.type === 'fill') return fill.trim();
  if (activity.type === 'choice' || activity.type === 'listen_select' || activity.type === 'image_choice' || activity.type === 'sentence_build') return selected.trim();
  return '';
}

function expectedAnswer(activity: AnyActivity) {
  if ('answer' in activity && typeof activity.answer === 'string') return activity.answer;
  return '';
}

function explanationFor(activity: AnyActivity) {
  if ('explanation' in activity && typeof activity.explanation === 'string') return activity.explanation;
  return '';
}

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
}

export default function AutoLessonPlayer() {
  const { lessonId = '' } = useParams();
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearnerProfile>({});
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [fill, setFill] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mistakeWarning, setMistakeWarning] = useState('');

  let lesson: Lesson | null = null;
  try { lesson = lessonById(lessonId); } catch { lesson = null; }

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setLoading(true);
      setLoadError(false);
      if (!current) {
        setLoading(false);
        return;
      }
      try {
        const [profileSnap, learnerProgress] = await Promise.all([getDoc(doc(db, 'users', current.uid)), loadLessonProgress(current.uid)]);
        if (!active) return;
        setProfile(profileSnap.exists() ? profileSnap.data() as LearnerProfile : {});
        setProgress(learnerProgress);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadKey]);

  const supportLanguage = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const dir = directionFor(supportLanguage);
  const ar = supportLanguage === 'Arabic';
  const loadingTitle = ar ? 'نحمّل الدرس…' : 'Loading lesson…';
  const loadErrorTitle = ar ? 'تعذّر تحميل الدرس' : 'Couldn’t load this lesson';
  const loadErrorBody = ar ? 'لم يتغيّر تقدّمك المحفوظ. تحقق من الاتصال وحاول مرة أخرى.' : 'Your saved progress was not changed. Check the connection and try again.';
  const saveErrorText = ar ? 'تعذّر حفظ إكمال الدرس. ابقَ هنا واضغط متابعة مرة أخرى.' : 'Lesson completion could not be saved. Stay here and press Continue again.';
  const mistakeWarningText = ar ? 'تم تقييم إجابتك، لكن تعذّر حفظ هذا الخطأ للمراجعة الذكية.' : 'Your answer was scored, but this mistake could not be saved for adaptive review.';

  if (loading) return <LearningShell dir={dir} language={supportLanguage} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title={loadingTitle} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <LearningShell dir={dir} language={supportLanguage} showDock={false}><StatusState icon={<AlertTriangle />} tone="danger" title={loadErrorTitle} body={loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{ar ? 'حاول مرة أخرى' : 'Try again'}</ETButton>} /></LearningShell>;
  if (!profile.nativeLanguage) return <Navigate to="/setup" replace />;
  if (!lesson) return <LearningShell dir={dir} language={supportLanguage} showDock={false}><StatusState icon={<AlertTriangle />} tone="danger" title={ar ? 'الدرس غير موجود' : 'Lesson not found'} action={<ETButton variant="secondary" onClick={() => nav('/learn')}><ArrowLeft /> {ar ? 'العودة للتعلّم' : 'Back to learn'}</ETButton>} /></LearningShell>;

  const uid = user.uid;
  const currentLesson = lesson;
  const activity = currentLesson.activities[index] as AnyActivity;
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / currentLesson.activities.length) * 100);

  async function rememberObjectiveMistake(given: string, expected: string, explanation: string) {
    const id = `${currentLesson.id}-activity-${index}`;
    const prompt = 'prompt' in activity && typeof activity.prompt === 'string' ? activity.prompt : currentLesson.title;
    const reviewContext = `${expected} ${given} ${prompt} ${explanation}`;
    const results = await Promise.allSettled([
      setDoc(doc(db, 'users', uid, 'mistakes', id), {
        lessonId: currentLesson.id,
        activityIndex: index,
        skill: currentLesson.skill,
        original: given,
        corrected: expected,
        reason: explanation,
        latestExample: prompt,
        timesSeen: increment(1),
        lastSeenAt: serverTimestamp(),
        source: 'lesson',
        status: 'active',
      }, { merge: true }),
      prioritizeReviewFromMistake(uid, currentLesson.id, reviewContext),
    ]);
    if (results.some(result => result.status === 'rejected')) throw new Error('mistake-persistence-failed');
  }

  async function finish(nextCorrect = correct, nextTotal = total) {
    if (saving || finished) return;
    setSaving(true);
    setSaveError('');
    try {
      const saved = await saveLessonCompletion(uid, currentLesson.id, nextCorrect, nextTotal);
      setProgress(current => ({ ...current, [currentLesson.id]: saved }));
      setFinished(true);
    } catch {
      setSaveError(saveErrorText);
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    setFeedback(null);
    setSelected('');
    setFill('');
    setSaveError('');
    setMistakeWarning('');
    setIndex(current => Math.min(current + 1, currentLesson.activities.length - 1));
  }

  function continuePassive() {
    if (index >= currentLesson.activities.length - 1) { void finish(correct, total); return; }
    goNext();
  }

  function check() {
    if (saving) return;
    if (isPassive(activity)) { continuePassive(); return; }
    if (feedback) {
      if (!feedback.ok) {
        setFeedback(null);
        setSelected('');
        setFill('');
        setMistakeWarning('');
        return;
      }
      if (index >= currentLesson.activities.length - 1) { void finish(correct, total); return; }
      goNext();
      return;
    }

    const answer = activityAnswer(activity, selected, fill);
    if (!answer) return;
    const expected = expectedAnswer(activity);
    const explanation = explanationFor(activity);
    const ok = normalizeAnswer(answer) === normalizeAnswer(expected);
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextTotal = total + 1;
    setMistakeWarning('');
    if (!ok) void rememberObjectiveMistake(answer, expected, explanation).catch(() => setMistakeWarning(mistakeWarningText));
    setCorrect(nextCorrect);
    setTotal(nextTotal);
    setFeedback({ ok, text: explanation });
  }

  if (finished) {
    const score = total ? Math.round((correct / total) * 100) : 100;
    return <LearningShell dir={dir} language={supportLanguage} showDock={false} className="et-lesson-shell">
      <Surface className="et-complete-card" tone="blue">
        <CheckCircle2 className="et-complete-icon" />
        <span className="et-eyebrow">{ar ? 'اكتمل الدرس' : 'LESSON COMPLETE'}</span>
        <h1>{currentLesson.title}</h1>
        <strong>{score}%</strong>
        <p>{ar ? `${correct} إجابات صحيحة من أصل ${total}.` : `${correct} correct out of ${total} scored activities.`}</p>
        <ETButton onClick={() => nav('/learn')}>{ar ? 'متابعة المسار' : 'Continue learning path'}</ETButton>
      </Surface>
    </LearningShell>;
  }

  const hasAnswer = isPassive(activity) || Boolean(selected || fill.trim());
  const actionLabel = saving
    ? (ar ? 'جارٍ الحفظ…' : 'Saving…')
    : feedback
      ? feedback.ok ? (ar ? 'متابعة' : 'Continue') : (ar ? 'حاول مرة أخرى' : 'Try again')
      : isPassive(activity) ? t(supportLanguage, 'continue') : t(supportLanguage, 'check');

  return <LearningShell dir={dir} language={supportLanguage} showDock={false} className="et-lesson-shell">
    <div className="et-lesson-header">
      <ETButton variant="ghost" onClick={() => nav('/learn')} aria-label={ar ? 'الخروج من الدرس' : 'Exit lesson'}><ArrowLeft /></ETButton>
      <ProgressBar value={progressPercent} />
      <span dir="ltr">{index + 1}/{currentLesson.activities.length}</span>
    </div>

    <div className="et-lesson-context">
      <span>{currentLesson.id.startsWith('a2-') ? 'A2' : 'A1'} · {currentLesson.skill}</span>
      <h1>{currentLesson.title}</h1>
      <div className="et-language-chip"><Languages /> {ar ? 'الشرح بالعربية · الهدف الإنجليزية' : `${supportLanguage} support · English target`}</div>
    </div>

    <Surface className="et-activity-card">
      {renderActivity(activity, selected, setSelected, fill, setFill, supportLanguage, saving || Boolean(feedback), feedback)}
    </Surface>

    <div className={`et-lesson-footer ${feedback ? (feedback.ok ? 'ok' : 'bad') : ''}`} aria-busy={saving}>
      {feedback ? <FeedbackBanner ok={feedback.ok} title={feedback.ok ? t(supportLanguage,'correct') : t(supportLanguage,'retry')}><p>{feedback.text}</p></FeedbackBanner> : null}
      {mistakeWarning ? <p className="error" role="status">{mistakeWarning}</p> : null}
      {saveError ? <p className="error" role="alert">{saveError}</p> : null}
      <ETButton className="et-full" disabled={saving || (!feedback && !hasAnswer)} onClick={check}>{actionLabel}</ETButton>
    </div>
  </LearningShell>;
}
