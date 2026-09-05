import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BrainCircuit, Send, Sparkles } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { loadLessonProgress } from './learning';
import { loadReviewCards } from './review';
import { directionFor, normalizeLanguage } from './languageSupport';
import { twinSupportCopy } from './twinSupportCopy';
import { buildTwinSnapshot, trimTwinConversation, TwinLearnerSnapshot, TwinMemoryMessage } from './twinMemory';

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
  learningGoal?: string;
  interfaceLanguage?: 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';
  nativeLanguage?: 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';
  explanationLanguage?: 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';
};

type Message = { role: 'learner' | 'twin'; text: string; detail?: TutorResponse };

const EMPTY_SNAPSHOT: TwinLearnerSnapshot = {
  completedLessons: [],
  weakSkills: [],
  recentMistakes: [],
  dueReviewTerms: [],
  recentConversation: [],
};

function mistakeKey(original: string, corrected: string, index: number) {
  const safe = `${original}-${corrected}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
  return safe || `mistake-${Date.now()}-${index}`;
}

export default function TutorMode() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [snapshot, setSnapshot] = useState<TwinLearnerSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [starterPending, setStarterPending] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const [profileSnap, progress, mistakesSnap, reviewCards, twinStateSnap] = await Promise.all([
        getDoc(doc(db, 'users', current.uid)),
        loadLessonProgress(current.uid),
        getDocs(collection(db, 'users', current.uid, 'mistakes')),
        loadReviewCards(current.uid),
        getDoc(doc(db, 'users', current.uid, 'twin', 'state')),
      ]);

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
      setMessages(savedConversation.length ? savedConversation.map(message => ({ ...message })) : []);
      setStarterPending(savedConversation.length === 0);
    } catch {
      setError('LOAD_FAILED');
    } finally { setLoading(false); }
  }), []);

  const supportLanguage = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const copy = twinSupportCopy[supportLanguage];
  const dir = directionFor(supportLanguage);
  const visibleMessages = starterPending && messages.length === 0 ? [{ role: 'twin' as const, text: copy.starter }] : messages;

  if (loading) return <div className="app-shell" dir={dir}><div className="phone"><main className="page"><BrainCircuit /><p>{copy.loading}</p></main><AppDock language={supportLanguage} /></div></div>;
  if (!user) return <Navigate to="/welcome" replace />;

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
      },
      { merge: true },
    )));
  }

  async function persistConversation(nextMessages: Message[]) {
    if (!user) return;
    const recentConversation = trimTwinConversation(nextMessages.map(message => ({ role: message.role, text: message.text })));
    await setDoc(doc(db, 'users', user.uid, 'twin', 'state'), {
      recentConversation,
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
    setInput('');
    setStarterPending(false);
    const learnerTurn: Message = { role: 'learner', text };
    const conversationBeforeReply = [...messages, learnerTurn];
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
          level: profile.placementLevel || profile.cefrLevel || 'A1',
          goal: profile.learningGoal || 'Daily conversation',
          nativeLanguage: profile.nativeLanguage || 'English',
          explanationLanguage: profile.explanationLanguage || profile.nativeLanguage || 'English',
          context: recentConversation.map(message => `${message.role}: ${message.text}`),
          learnerSnapshot: { ...snapshot, recentConversation },
        }),
      });
      if (!response.ok) throw new Error('Tutor unavailable');
      const detail = await response.json() as TutorResponse;
      const twinTurn: Message = { role: 'twin', text: detail.reply, detail };
      const nextMessages = [...conversationBeforeReply, twinTurn];
      await Promise.all([rememberMistakes(detail, text), persistConversation(nextMessages)]);
      setMessages(nextMessages);
    } catch {
      setInput(text);
      setError(copy.unavailable);
    } finally { setBusy(false); }
  }

  const memoryLine = `${snapshot.weakSkills.slice(0, 3).map(item => item.skill).join(' · ') || copy.progressFallback}${snapshot.dueReviewTerms.length ? ` · ${copy.reviewPrefix}: ${snapshot.dueReviewTerms.slice(0, 4).join(', ')}` : ''}`;
  const displayError = error === 'LOAD_FAILED' ? copy.unavailable : error;

  return <div className="app-shell" dir={dir}><div className="phone"><main className="page twin-page-v6">
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> {copy.backPractice}</button>
    <header className="twin-hero-v6"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div><div className="twin compact idle twin-hero-mark" aria-hidden="true"><div className="twin-aura" /><div className="twin-core"><span className="twin-eye left" /><span className="twin-eye right" /><i className="twin-mouth" /></div></div></header>
    {(snapshot.weakSkills.length > 0 || snapshot.dueReviewTerms.length > 0) && <section className="twin-memory-strip">
      <BrainCircuit />
      <div><b>{copy.memoryTitle}</b><p>{memoryLine}</p></div>
    </section>}
    <section className="tutor-thread" aria-live="polite">
      {visibleMessages.map((message, index) => <article className={`tutor-message ${message.role}`} key={`${message.role}-${index}`}>
        <span>{message.role === 'twin' ? copy.twin : copy.you}</span>
        <p>{message.text}</p>
        {'detail' in message && message.detail?.correction && <div className="tutor-correction"><Sparkles /><div><b>{copy.natural}</b><p>{message.detail.correction}</p>{message.detail.explanation && <small>{message.detail.explanation}</small>}</div></div>}
        {'detail' in message && message.detail?.detectedMistakes?.length ? <div className="tutor-mistakes">{message.detail.detectedMistakes.map((mistake, i) => <div key={i}><del>{mistake.original}</del><b>{mistake.corrected}</b><small>{mistake.reason}</small></div>)}</div> : null}
        {'detail' in message && message.detail?.suggestedReply && <button className="ghost tutor-suggestion" onClick={() => setInput(message.detail!.suggestedReply!)}>{copy.tryPrefix}: “{message.detail.suggestedReply}”</button>}
      </article>)}
      {busy && <article className="tutor-message twin tutor-thinking"><span>{copy.twin}</span><p>{copy.thinking}</p></article>}
    </section>
    {displayError && <p className="error" role="alert">{displayError}</p>}
    <form className="tutor-composer" onSubmit={send}>
      <input dir="ltr" value={input} onChange={event => setInput(event.target.value)} maxLength={1200} placeholder={copy.placeholder} aria-label={copy.placeholder} />
      <button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send /></button>
    </form>
  </main><AppDock language={supportLanguage} /></div></div>;
}
