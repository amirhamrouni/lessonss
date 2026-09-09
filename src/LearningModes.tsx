import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, BrainCircuit, Check, ChevronRight, Gauge, LoaderCircle, Mic, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { ETButton, LearningShell, StatusState } from './ui/LearningUI';
import { auth, db } from './firebase';
import { loadLessonProgress, ProgressMap } from './learning';
import { placementQuestions, scorePlacement } from './assessment';
import { Rating, StoredReviewCard, dueCards, ensureReviewCards, meaningForLanguage, saveReviewRating } from './review';
import { directionFor, normalizeLanguage, SupportedLanguage, t } from './languageSupport';
import { modeSupportCopy } from './modeSupportCopy';
import { pronunciationSupportCopy } from './pronunciationSupportCopy';

type LearnerState = {
  loading: string;
  loadError: string;
  loadErrorBody: string;
  retry: string;
  reviewUnavailable: string;
  reviewUnavailableBody: string;
  ratingError: string;
  assessmentSaveError: string;
  noAssessment: string;
};

const learnerStateCopy: Record<SupportedLanguage, LearnerState> = {
  English: {
    loading: 'Loading your practice space…',
    loadError: 'Couldn’t load your learning data',
    loadErrorBody: 'Your saved progress was not changed. Check the connection and try again.',
    retry: 'Try again',
    reviewUnavailable: 'Smart Review is temporarily unavailable',
    reviewUnavailableBody: 'We could not prepare your FSRS queue. Your saved review history is unchanged.',
    ratingError: 'That review rating could not be saved. Try again.',
    assessmentSaveError: 'Your placement result could not be saved. Try again before leaving this screen.',
    noAssessment: 'No placement questions are available right now.',
  },
  Arabic: {
    loading: 'نحمّل مساحة التدريب…',
    loadError: 'تعذّر تحميل بيانات التعلّم',
    loadErrorBody: 'لم يتغيّر تقدّمك المحفوظ. تحقق من الاتصال وحاول مرة أخرى.',
    retry: 'حاول مرة أخرى',
    reviewUnavailable: 'المراجعة الذكية غير متاحة مؤقتًا',
    reviewUnavailableBody: 'تعذّر تجهيز قائمة FSRS. سجل المراجعة المحفوظ لم يتغيّر.',
    ratingError: 'تعذّر حفظ تقييم هذه البطاقة. حاول مرة أخرى.',
    assessmentSaveError: 'تعذّر حفظ نتيجة تحديد المستوى. حاول مرة أخرى قبل مغادرة الشاشة.',
    noAssessment: 'لا توجد أسئلة تحديد مستوى متاحة الآن.',
  },
  Dutch: {
    loading: 'Je oefenruimte wordt geladen…',
    loadError: 'Je leergegevens konden niet worden geladen',
    loadErrorBody: 'Je opgeslagen voortgang is niet gewijzigd. Controleer de verbinding en probeer opnieuw.',
    retry: 'Opnieuw proberen',
    reviewUnavailable: 'Slim herhalen is tijdelijk niet beschikbaar',
    reviewUnavailableBody: 'De FSRS-wachtrij kon niet worden voorbereid. Je opgeslagen reviewgeschiedenis is ongewijzigd.',
    ratingError: 'Deze beoordeling kon niet worden opgeslagen. Probeer opnieuw.',
    assessmentSaveError: 'Je niveautestresultaat kon niet worden opgeslagen. Probeer opnieuw voordat je dit scherm verlaat.',
    noAssessment: 'Er zijn nu geen niveautestvragen beschikbaar.',
  },
  French: {
    loading: 'Chargement de ton espace d’entraînement…',
    loadError: 'Impossible de charger tes données',
    loadErrorBody: 'Ta progression enregistrée n’a pas changé. Vérifie la connexion et réessaie.',
    retry: 'Réessayer',
    reviewUnavailable: 'La révision intelligente est temporairement indisponible',
    reviewUnavailableBody: 'Impossible de préparer la file FSRS. Ton historique enregistré est inchangé.',
    ratingError: 'Cette évaluation n’a pas pu être enregistrée. Réessaie.',
    assessmentSaveError: 'Le résultat du test de niveau n’a pas pu être enregistré. Réessaie avant de quitter cet écran.',
    noAssessment: 'Aucune question de niveau n’est disponible pour le moment.',
  },
  German: {
    loading: 'Dein Übungsbereich wird geladen…',
    loadError: 'Deine Lerndaten konnten nicht geladen werden',
    loadErrorBody: 'Dein gespeicherter Fortschritt wurde nicht verändert. Prüfe die Verbindung und versuche es erneut.',
    retry: 'Erneut versuchen',
    reviewUnavailable: 'Smart Review ist vorübergehend nicht verfügbar',
    reviewUnavailableBody: 'Die FSRS-Warteschlange konnte nicht vorbereitet werden. Dein gespeicherter Verlauf bleibt unverändert.',
    ratingError: 'Diese Bewertung konnte nicht gespeichert werden. Versuche es erneut.',
    assessmentSaveError: 'Dein Einstufungsergebnis konnte nicht gespeichert werden. Versuche es erneut, bevor du diese Ansicht verlässt.',
    noAssessment: 'Zurzeit sind keine Einstufungsfragen verfügbar.',
  },
  Spanish: {
    loading: 'Cargando tu espacio de práctica…',
    loadError: 'No se pudieron cargar tus datos',
    loadErrorBody: 'Tu progreso guardado no cambió. Revisa la conexión y vuelve a intentarlo.',
    retry: 'Intentar de nuevo',
    reviewUnavailable: 'La revisión inteligente no está disponible temporalmente',
    reviewUnavailableBody: 'No pudimos preparar la cola FSRS. Tu historial guardado no cambió.',
    ratingError: 'No se pudo guardar esta valoración. Inténtalo de nuevo.',
    assessmentSaveError: 'No se pudo guardar el resultado de nivel. Inténtalo de nuevo antes de salir de esta pantalla.',
    noAssessment: 'No hay preguntas de nivel disponibles ahora mismo.',
  },
};

function useLearner() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setLoading(true);
      setError(false);
      setUser(current);
      if (!current) {
        setProgress({});
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const [p, snap] = await Promise.all([loadLessonProgress(current.uid), getDoc(doc(db, 'users', current.uid))]);
        if (!active) return;
        setProgress(p);
        setProfile(snap.exists() ? snap.data() : {});
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [reloadKey]);

  return { user, progress, profile, loading, error, retry: () => setReloadKey(value => value + 1) };
}

function supportLanguage(profile: Record<string, any> | null) {
  return normalizeLanguage(profile?.explanationLanguage || profile?.nativeLanguage || profile?.interfaceLanguage || 'English');
}

function Frame({ children, language, showDock = true }: { children: ReactNode; language?: string; showDock?: boolean }) {
  const normalized = normalizeLanguage(language || 'English');
  return <LearningShell language={normalized} dir={directionFor(normalized)} pageClassName="mode-page" showDock={showDock}>{children}</LearningShell>;
}

function Loading({ language }: { language?: string }) {
  const normalized = normalizeLanguage(language || 'English');
  return <Frame language={normalized} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title={learnerStateCopy[normalized].loading} /></Frame>;
}

function LearnerError({ language, retry }: { language?: string; retry: () => void }) {
  const normalized = normalizeLanguage(language || 'English');
  const copy = learnerStateCopy[normalized];
  return <Frame language={normalized}><StatusState icon={<AlertTriangle />} tone="danger" title={copy.loadError} body={copy.loadErrorBody} action={<ETButton onClick={retry}>{copy.retry}</ETButton>} /></Frame>;
}

function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function PracticeHub() {
  const { user, progress, profile, loading, error, retry } = useLearner();
  const nav = useNavigate();
  const [dueCount, setDueCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);
  const language = supportLanguage(profile);
  const modeCopy = modeSupportCopy[language];
  const pronunciationCopy = pronunciationSupportCopy[language];
  const state = learnerStateCopy[language];

  useEffect(() => {
    if (!user) return;
    let active = true;
    const completed = Object.values(progress).filter(p => p.completed).map(p => p.lessonId);
    setReviewLoading(true);
    setReviewError(false);
    ensureReviewCards(user.uid, completed)
      .then(cards => { if (active) setDueCount(dueCards(cards).length); })
      .catch(() => { if (active) setReviewError(true); })
      .finally(() => { if (active) setReviewLoading(false); });
    return () => { active = false; };
  }, [user, progress, reviewKey]);

  if (loading) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (error) return <LearnerError language={language} retry={retry} />;

  const completed = Object.values(progress).filter(p => p.completed).length;
  const dueHeadline = reviewError ? state.reviewUnavailable : dueCount ? `${dueCount} ${t(language, 'reviewDueSuffix')}` : completed ? t(language, 'buildRecall') : t(language, 'completeLessonFirst');
  const placementBody = profile?.placementLevel ? modeCopy.placementCurrent(profile.placementLevel) : modeCopy.placementDescription;

  return <Frame language={language}>
    <div dir={directionFor(language)}>
      <header><div><span className="eyebrow">{t(language, 'practiceEyebrow')}</span><h1>{t(language, 'practice')}</h1><p>{t(language, 'practiceIntro')}</p></div></header>
      <section className="practice-command">
        <div><span className="mode-kicker">{t(language, 'recommended')}</span><h2>{dueHeadline}</h2><p>{reviewError ? state.reviewUnavailableBody : t(language, 'fsrsCompletedOnly')}</p></div>
        <button type="button" disabled={reviewLoading || (!reviewError && !dueCount)} onClick={() => reviewError ? setReviewKey(value => value + 1) : nav('/review')} aria-busy={reviewLoading}>
          {reviewLoading ? '…' : reviewError ? state.retry : dueCount ? t(language, 'reviewNow') : t(language, 'nothingDue')} <ChevronRight />
        </button>
      </section>
      <div className="mode-list">
        <button type="button" onClick={() => nav('/review')}><RotateCcw /><div><span>{t(language, 'memory')}</span><h3>{t(language, 'smartReview')}</h3><p>{t(language, 'smartReviewDescription')}</p></div><ChevronRight /></button>
        <button type="button" onClick={() => nav('/sentence-builder')}><Sparkles /><div><span>{t(language, 'output')}</span><h3>{t(language, 'sentenceBuilder')}</h3><p>{t(language, 'sentenceBuilderDescription')}</p></div><ChevronRight /></button>
        <button type="button" className="pronunciation-mode-entry" onClick={() => nav('/pronunciation')}><Volume2 /><div><span>{pronunciationCopy.eyebrow}</span><h3>{pronunciationCopy.title}</h3><p>{pronunciationCopy.intro}</p></div><ChevronRight /></button>
        <button type="button" onClick={() => nav('/assessment')}><Gauge /><div><span>{t(language, 'diagnostic')}</span><h3>{t(language, 'placementTest')}</h3><p>{placementBody}</p></div><ChevronRight /></button>
        <button type="button" onClick={() => nav('/speak')}><Mic /><div><span>{t(language, 'voice')}</span><h3>{t(language, 'conversationLab')}</h3><p>{t(language, 'conversationDescription')}</p></div><ChevronRight /></button>
      </div>
    </div>
  </Frame>;
}

export function ReviewMode() {
  const { user, progress, profile, loading, error, retry } = useLearner();
  const nav = useNavigate();
  const [cards, setCards] = useState<StoredReviewCard[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [reviewError, setReviewError] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);
  const [actionError, setActionError] = useState('');
  const language = supportLanguage(profile);
  const copy = modeSupportCopy[language];
  const state = learnerStateCopy[language];
  const dir = directionFor(language);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const completed = Object.values(progress).filter(p => p.completed).map(p => p.lessonId);
    setReady(false);
    setReviewError(false);
    setActionError('');
    ensureReviewCards(user.uid, completed)
      .then(value => { if (active) setCards(value); })
      .catch(() => { if (active) setReviewError(true); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [user, progress, reviewKey]);

  if (loading || !ready) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (error) return <LearnerError language={language} retry={retry} />;
  if (reviewError) return <Frame language={language}><StatusState icon={<AlertTriangle />} tone="danger" title={state.reviewUnavailable} body={state.reviewUnavailableBody} action={<ETButton onClick={() => setReviewKey(value => value + 1)}>{state.retry}</ETButton>} /></Frame>;

  const queue = dueCards(cards);
  const card = queue[0];
  const nativeMeaning = card ? meaningForLanguage(card, language) : '';

  async function rate(rating: Rating) {
    if (!card || !user || busy) return;
    setBusy(true);
    setActionError('');
    try {
      const next = await saveReviewRating(user.uid, card, rating);
      setCards(current => current.map(item => item.id === card.id ? next : item));
      setShowAnswer(false);
    } catch {
      setActionError(state.ratingError);
    } finally {
      setBusy(false);
    }
  }

  return <Frame language={language}>
    <div dir={dir}>
      <button type="button" className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button>
      <header><div><span className="eyebrow">FSRS MEMORY</span><h1>{copy.smartReview}</h1><p>{copy.cardsDue(queue.length)}</p></div></header>
      {!card ? <section className="mode-empty"><Check /><h2>{copy.caughtUp}</h2><p>{copy.caughtUpBody}</p><button type="button" onClick={() => nav('/practice')}>{copy.backToPractice}</button></section> :
        <section className="review-card">
          <span className="mode-kicker">{copy.vocabularyLeft(queue.length)}</span>
          <div dir="ltr" className="review-term-row">
            <div><h2>{card.term}</h2>{card.phonetic ? <small className="review-phonetic">{card.phonetic}</small> : null}</div>
            <button className="review-audio" type="button" aria-label={`Play ${card.term}`} onClick={() => speakEnglish(card.term)}><Volume2 /></button>
          </div>
          {!showAnswer ? <><p>{copy.recallBeforeReveal}</p><button type="button" className="reveal" onClick={() => setShowAnswer(true)}>{copy.revealAnswer}</button></> : <>
            <div className="review-answer" dir={dir}><strong>{nativeMeaning}</strong><p dir="ltr">{card.example}</p></div>
            <button className="review-example-audio" type="button" onClick={() => speakEnglish(card.example)}><Volume2 /> {copy.hearExample}</button>
            <div className="rating-row">
              <button type="button" disabled={busy} aria-busy={busy} onClick={() => void rate(Rating.Again)}><span>{copy.again}</span><small>{copy.againHint}</small></button>
              <button type="button" disabled={busy} aria-busy={busy} onClick={() => void rate(Rating.Hard)}><span>{copy.hard}</span><small>{copy.hardHint}</small></button>
              <button type="button" disabled={busy} aria-busy={busy} onClick={() => void rate(Rating.Good)}><span>{copy.good}</span><small>{copy.goodHint}</small></button>
              <button type="button" disabled={busy} aria-busy={busy} onClick={() => void rate(Rating.Easy)}><span>{copy.easy}</span><small>{copy.easyHint}</small></button>
            </div>
            {actionError ? <p className="error" role="alert">{actionError}</p> : null}
          </>}
        </section>}
    </div>
  </Frame>;
}

type Builder = { prompt: string; words: string[]; answer: string[] };

function buildersFor(name: string): Builder[] {
  return [
    { prompt: 'Introduce yourself', words: [name, 'I’m', 'Hello'], answer: ['Hello', 'I’m', name] },
    { prompt: 'Talk about a routine', words: ['every', 'work', 'I', 'day'], answer: ['I', 'work', 'every', 'day'] },
    { prompt: 'Order politely', words: ['please', 'coffee', 'a', 'like', 'I’d'], answer: ['I’d', 'like', 'a', 'coffee', 'please'] },
    { prompt: 'Ask for a place', words: ['station', 'the', 'is', 'Where'], answer: ['Where', 'is', 'the', 'station'] },
  ];
}

export function SentenceBuilderMode() {
  const { user, profile, loading, error, retry } = useLearner();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  const language = supportLanguage(profile);
  const copy = modeSupportCopy[language];
  const learnerName = String(profile?.displayName || user?.displayName || 'Learner').trim().split(/\s+/)[0] || 'Learner';
  const builders = useMemo(() => buildersFor(learnerName), [learnerName]);

  if (loading) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (error) return <LearnerError language={language} retry={retry} />;

  const item = builders[index % builders.length];
  const remaining = item.words.filter((word, i) => {
    const usedBefore = built.filter(x => x === word).length;
    const occurrence = item.words.slice(0, i + 1).filter(x => x === word).length;
    return occurrence > usedBefore;
  });
  function check() { setResult(JSON.stringify(built) === JSON.stringify(item.answer) ? 'ok' : 'bad'); }
  function next() { setIndex((index + 1) % builders.length); setBuilt([]); setResult(null); }

  return <Frame language={language}>
    <button type="button" className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button>
    <header><div><span className="eyebrow">ACTIVE OUTPUT</span><h1>Sentence Builder</h1><p>Construct the sentence. Don’t just recognize it.</p></div></header>
    <section className="builder-card">
      <span className="mode-kicker">{index + 1} / {builders.length}</span><h2>{item.prompt}</h2>
      <div className="built-zone">{built.length ? built.map((word, i) => <button type="button" key={`${word}-${i}`} onClick={() => { setBuilt(built.filter((_, j) => j !== i)); setResult(null); }}>{word}</button>) : <span>Tap words below to build the sentence</span>}</div>
      <div className="word-bank">{remaining.map((word, i) => <button type="button" key={`${word}-${i}`} onClick={() => { setBuilt([...built, word]); setResult(null); }}>{word}</button>)}</div>
      {result ? <div className={`builder-feedback ${result}`} role="status">{result === 'ok' ? 'Correct — natural word order.' : `Try again. Target: ${item.answer.join(' ')}.`}</div> : null}
      <div className="builder-actions"><button type="button" onClick={() => { setBuilt([]); setResult(null); }}>Reset</button>{result === 'ok' ? <button type="button" className="solid" onClick={next}>Next</button> : <button type="button" className="solid" disabled={!built.length} onClick={check}>Check</button>}</div>
    </section>
  </Frame>;
}

export function AssessmentMode() {
  const { user, profile, loading, error, retry } = useLearner();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const result = useMemo(() => scorePlacement(answers), [answers]);
  const language = supportLanguage(profile);
  const copy = modeSupportCopy[language];
  const state = learnerStateCopy[language];
  const dir = directionFor(language);

  if (loading) return <Loading language={language} />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (error) return <LearnerError language={language} retry={retry} />;

  const uid = user.uid;
  const question = placementQuestions[index];

  async function finish() {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const final = scorePlacement(answers);
      await Promise.all([
        setDoc(doc(db, 'users', uid), { placementLevel: final.level, placementCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, 'users', uid, 'assessments', 'latest'), { ...final, answers, completedAt: serverTimestamp() }),
      ]);
      setFinished(true);
    } catch {
      setSaveError(state.assessmentSaveError);
    } finally {
      setSaving(false);
    }
  }

  if (!question && !finished) return <Frame language={language}><StatusState icon={<AlertTriangle />} title={state.noAssessment} action={<ETButton variant="secondary" onClick={() => nav('/practice')}>{copy.backPractice}</ETButton>} /></Frame>;

  if (finished) return <Frame language={language}><div dir={dir}><button type="button" className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button><section className="assessment-result"><span className="mode-kicker">{copy.placementResult}</span><strong>{result.level}</strong><h2>{copy.overall(result.percent)}</h2><p>{copy.correctOf(result.correct,result.total)}</p><div className="skill-result">{Object.entries(result.skillScores).map(([skill, score]) => <div key={skill}><span>{copy.skills[skill] || skill}</span><b>{score}%</b></div>)}</div><button type="button" onClick={() => { setAnswers({}); setIndex(0); setFinished(false); setSaveError(''); }}>{copy.retakeAssessment}</button></section></div></Frame>;

  const selected = answers[question.id];
  const skillLabel = copy.skills[question.skill] || question.skill;
  return <Frame language={language}>
    <div dir={dir}>
      <button type="button" className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button>
      <header><div><span className="eyebrow">{copy.cefrDiagnostic}</span><h1>{copy.placement}</h1><p>{copy.placementIntro}</p></div></header>
      <div className="assessment-progress" role="progressbar" aria-valuemin={0} aria-valuemax={placementQuestions.length} aria-valuenow={index + 1}><i style={{ width: `${((index + 1) / placementQuestions.length) * 100}%` }} /></div>
      <section className="assessment-card">
        <span className="mode-kicker">{skillLabel} · {question.level} · {index + 1}/{placementQuestions.length}</span>
        <div className="native-instruction" dir={dir}>{copy.chooseEnglish}</div>
        <h2 dir="ltr">{question.prompt}</h2>
        <div className="assessment-options" dir="ltr">{question.options.map(option => <button type="button" className={selected === option ? 'selected' : ''} aria-pressed={selected === option} key={option} onClick={() => { setAnswers({ ...answers, [question.id]: option }); setSaveError(''); }}>{option}</button>)}</div>
        <button type="button" className="assessment-next" disabled={!selected || saving} aria-busy={saving} onClick={() => index === placementQuestions.length - 1 ? void finish() : setIndex(index + 1)}>{saving ? copy.saving : index === placementQuestions.length - 1 ? copy.finishAssessment : copy.nextQuestion}</button>
        {saveError ? <p className="error" role="alert">{saveError}</p> : null}
      </section>
    </div>
  </Frame>;
}
