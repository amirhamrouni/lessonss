import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, BrainCircuit, LoaderCircle, Send, Sparkles, Target } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { loadLessonProgress } from './learning';
import { loadReviewCards } from './review';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
import { twinSupportCopy } from './twinSupportCopy';
import { buildTwinSnapshot, trimTwinConversation, TwinLearnerSnapshot, TwinMemoryMessage } from './twinMemory';
import { buildTwinCurriculumContext, type TwinCurriculumContext } from './twinCurriculumContext';

type TutorResponse = {
  reply: string;
  correction: string | null;
  explanation: string | null;
  suggestedReply: string | null;
  detectedMistakes: Array<{ original: string; corrected: string; reason: string }>;
};

type Profile = {
  placementLevel?: string;
  cefrLevel?: string;
  currentCurriculumLevel?: string;
  learningGoal?: string;
  interfaceLanguage?: SupportedLanguage;
  nativeLanguage?: SupportedLanguage;
  explanationLanguage?: SupportedLanguage;
};

type Message = { role: 'learner' | 'twin'; text: string; detail?: TutorResponse };

const EMPTY_SNAPSHOT: TwinLearnerSnapshot = {
  completedLessons: [],
  weakSkills: [],
  recentMistakes: [],
  dueReviewTerms: [],
  recentConversation: [],
};
const EMPTY_CONTEXT: TwinCurriculumContext = { level:'A1',canDo:[],targetFunctions:[] };

const stateCopy: Record<SupportedLanguage, { loadError:string; loadErrorBody:string; retry:string; memoryWarning:string }> = {
  English:{loadError:'Couldn’t load Twin Coach',loadErrorBody:'Your saved progress and Twin memory were not changed. Check the connection and try again.',retry:'Try again',memoryWarning:'Twin replied, but this turn could not be saved to learning memory.'},
  Arabic:{loadError:'تعذّر تحميل Twin Coach',loadErrorBody:'لم يتغيّر تقدّمك أو ذاكرة Twin المحفوظة. تحقق من الاتصال وحاول مرة أخرى.',retry:'حاول مرة أخرى',memoryWarning:'وصل رد Twin، لكن تعذّر حفظ هذه المحادثة في ذاكرة التعلّم.'},
  Dutch:{loadError:'Twin Coach kon niet worden geladen',loadErrorBody:'Je opgeslagen voortgang en Twin-geheugen zijn niet gewijzigd. Controleer de verbinding en probeer opnieuw.',retry:'Opnieuw proberen',memoryWarning:'Twin heeft geantwoord, maar deze beurt kon niet in het leergeheugen worden opgeslagen.'},
  French:{loadError:'Impossible de charger Twin Coach',loadErrorBody:'Ta progression et la mémoire Twin enregistrées n’ont pas changé. Vérifie la connexion et réessaie.',retry:'Réessayer',memoryWarning:'Twin a répondu, mais cet échange n’a pas pu être enregistré dans la mémoire d’apprentissage.'},
  German:{loadError:'Twin Coach konnte nicht geladen werden',loadErrorBody:'Dein gespeicherter Fortschritt und Twin-Speicher wurden nicht verändert. Prüfe die Verbindung und versuche es erneut.',retry:'Erneut versuchen',memoryWarning:'Twin hat geantwortet, aber dieser Austausch konnte nicht im Lernspeicher gespeichert werden.'},
  Spanish:{loadError:'No se pudo cargar Twin Coach',loadErrorBody:'Tu progreso y memoria de Twin guardados no cambiaron. Revisa la conexión y vuelve a intentarlo.',retry:'Intentar de nuevo',memoryWarning:'Twin respondió, pero este turno no pudo guardarse en la memoria de aprendizaje.'},
};

function mistakeKey(original: string, corrected: string, index: number) {
  const safe = `${original}-${corrected}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
  return safe || `mistake-${Date.now()}-${index}`;
}

export default function TutorMode() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [snapshot, setSnapshot] = useState<TwinLearnerSnapshot>(EMPTY_SNAPSHOT);
  const [curriculumContext,setCurriculumContext] = useState<TwinCurriculumContext>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [memoryWarning, setMemoryWarning] = useState('');
  const [starterPending, setStarterPending] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setLoading(true);
      setLoadError(false);
      if (!current) { setLoading(false); return; }
      try {
        const [profileSnap, progress, mistakesSnap, reviewCards, twinStateSnap] = await Promise.all([
          getDoc(doc(db, 'users', current.uid)),
          loadLessonProgress(current.uid),
          getDocs(collection(db, 'users', current.uid, 'mistakes')),
          loadReviewCards(current.uid),
          getDoc(doc(db, 'users', current.uid, 'twin', 'state')),
        ]);
        if (!active) return;

        const nextProfile = profileSnap.exists() ? profileSnap.data() as Profile : {};
        const savedConversation = twinStateSnap.exists()
          ? trimTwinConversation((twinStateSnap.data().recentConversation || []) as TwinMemoryMessage[])
          : [];
        const learnerSnapshot = buildTwinSnapshot({
          progress: Object.values(progress),
          mistakes: mistakesSnap.docs.map(item => item.data()),
          reviewCards,
          conversation: savedConversation,
        });

        setProfile(nextProfile);
        setSnapshot(learnerSnapshot);
        setCurriculumContext(buildTwinCurriculumContext(nextProfile,progress));
        setMessages(savedConversation.length ? savedConversation.map(message => ({ ...message })) : []);
        setStarterPending(savedConversation.length === 0);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [reloadKey]);

  const supportLanguage = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const copy = twinSupportCopy[supportLanguage];
  const state = stateCopy[supportLanguage];
  const dir = directionFor(supportLanguage);
  const visibleMessages = starterPending && messages.length === 0 ? [{ role: 'twin' as const, text: copy.starter }] : messages;

  if (loading) return <LearningShell language={supportLanguage} dir={dir} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="TWIN COACH" title={copy.loading} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <LearningShell language={supportLanguage} dir={dir}><StatusState icon={<AlertTriangle />} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{state.retry}</ETButton>} /></LearningShell>;

  async function rememberMistakes(detail: TutorResponse, learnerMessage: string) {
    if (!user || !detail.detectedMistakes.length) return;
    await Promise.all(detail.detectedMistakes.map((mistake, index) => setDoc(
      doc(db, 'users', user.uid, 'mistakes', mistakeKey(mistake.original, mistake.corrected, index)),
      {
        original: mistake.original,
        corrected: mistake.corrected,
        reason: mistake.reason,
        latestExample: learnerMessage,
        timesSeen: increment(1),
        lastSeenAt: serverTimestamp(),
        source: 'twin-coach',
        skill: 'twin-coach',
        status: 'active',
        curriculumLevel: curriculumContext.level,
        curriculumLessonId: curriculumContext.lessonId || null,
      },
      { merge: true },
    )));
  }

  async function persistConversation(nextMessages: Message[]) {
    if (!user) return;
    const recentConversation = trimTwinConversation(nextMessages.map(message => ({ role: message.role, text: message.text })));
    await setDoc(doc(db, 'users', user.uid, 'twin', 'state'), {
      recentConversation,
      curriculumContext,
      interactionCount: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setSnapshot(current => ({ ...current, recentConversation }));
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || !user) return;
    setError('');
    setMemoryWarning('');
    setInput('');
    setStarterPending(false);
    const messagesBeforeSend = messages;
    const learnerTurn: Message = { role: 'learner', text };
    const conversationBeforeReply = [...messagesBeforeSend, learnerTurn];
    setMessages(conversationBeforeReply);
    setBusy(true);
    try {
      const recentConversation = trimTwinConversation(conversationBeforeReply.map(message => ({ role: message.role, text: message.text })));
      const idToken = await user.getIdToken();
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          message: text,
          level: curriculumContext.level || profile.currentCurriculumLevel || profile.placementLevel || profile.cefrLevel || 'A1',
          goal: profile.learningGoal || 'Daily conversation',
          nativeLanguage: profile.nativeLanguage || 'English',
          explanationLanguage: profile.explanationLanguage || profile.nativeLanguage || 'English',
          context: recentConversation.map(message => `${message.role}: ${message.text}`),
          learnerSnapshot: { ...snapshot, recentConversation },
          curriculumContext,
        }),
      });
      if (!response.ok) throw new Error('Tutor unavailable');
      const detail = await response.json() as TutorResponse;
      const twinTurn: Message = { role: 'twin', text: detail.reply, detail };
      const nextMessages = [...conversationBeforeReply, twinTurn];
      setMessages(nextMessages);

      const persistence = await Promise.allSettled([
        rememberMistakes(detail, text),
        persistConversation(nextMessages),
      ]);
      if (persistence.some(result => result.status === 'rejected')) setMemoryWarning(state.memoryWarning);
    } catch {
      setMessages(messagesBeforeSend);
      setInput(text);
      setError(copy.unavailable);
    } finally {
      setBusy(false);
    }
  }

  const memoryLine = `${snapshot.weakSkills.slice(0, 3).map(item => item.skill).join(' · ') || copy.progressFallback}${snapshot.dueReviewTerms.length ? ` · ${copy.reviewPrefix}: ${snapshot.dueReviewTerms.slice(0, 4).join(', ')}` : ''}`;

  return <LearningShell language={supportLanguage} dir={dir} className="et-twin-shell">
    <PageTitle eyebrow={copy.eyebrow} title={copy.title} description={copy.intro} />

    {curriculumContext.lessonId ? <Surface className="et-curriculum-strip" tone="teal"><Target/><div><b>{curriculumContext.level} · {curriculumContext.unitTitle || curriculumContext.lessonId}</b><p>{curriculumContext.canDo.slice(0,2).join(' · ')}</p>{curriculumContext.targetFunctions.length?<small>{curriculumContext.targetFunctions.slice(0,4).join(' · ')}</small>:null}</div></Surface> : null}

    {(snapshot.weakSkills.length > 0 || snapshot.dueReviewTerms.length > 0) ? <Surface className="et-memory-strip" tone="blue">
      <BrainCircuit />
      <div><b>{copy.memoryTitle}</b><p>{memoryLine}</p></div>
    </Surface> : null}

    <section className="et-chat-thread" aria-live="polite" aria-busy={busy}>
      {visibleMessages.map((message, index) => <article className={`et-chat-message ${message.role}`} key={`${message.role}-${index}`}>
        <span>{message.role === 'twin' ? copy.twin : copy.you}</span>
        <div className="et-chat-bubble"><p>{message.text}</p></div>
        {'detail' in message && message.detail?.correction ? <Surface className="et-correction-card" tone="teal"><Sparkles /><div><b>{copy.natural}</b><p>{message.detail.correction}</p>{message.detail.explanation ? <small>{message.detail.explanation}</small> : null}</div></Surface> : null}
        {'detail' in message && message.detail?.detectedMistakes?.length ? <div className="et-chat-mistakes">{message.detail.detectedMistakes.map((mistake, i) => <div key={i}><del>{mistake.original}</del><b>{mistake.corrected}</b><small>{mistake.reason}</small></div>)}</div> : null}
        {'detail' in message && message.detail?.suggestedReply ? <ETButton variant="soft" onClick={() => setInput(message.detail!.suggestedReply!)} disabled={busy}>{copy.tryPrefix}: “{message.detail.suggestedReply}”</ETButton> : null}
      </article>)}
      {busy ? <article className="et-chat-message twin"><span>{copy.twin}</span><div className="et-chat-bubble thinking"><p>{copy.thinking}</p></div></article> : null}
    </section>

    {error ? <p className="error" role="alert">{error}</p> : null}
    {memoryWarning ? <p className="et-memory-warning" role="status">{memoryWarning}</p> : null}

    <form className="et-chat-composer" onSubmit={send}>
      <input dir="ltr" value={input} disabled={busy} onChange={event => setInput(event.target.value)} maxLength={1200} placeholder={copy.placeholder} aria-label={copy.placeholder} />
      <button type="submit" disabled={busy || !input.trim()} aria-busy={busy} aria-label="Send"><Send /></button>
    </form>
  </LearningShell>;
}
