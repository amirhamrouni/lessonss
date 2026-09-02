import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BrainCircuit, Send, Sparkles } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { loadLessonProgress } from './learning';
import { loadReviewCards } from './review';
import { normalizeLanguage } from './languageSupport';
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
      setMessages(savedConversation.length
        ? savedConversation.map(message => ({ ...message }))
        : [{ role: 'twin', text: 'Tell me something you would actually say in real life. I’ll adapt to what you are learning and what you keep finding difficult.' }]);
    } finally { setLoading(false); }
  }), []);

  const supportLanguage = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');

  if (loading) return <div className="app-shell"><div className="phone"><main className="page"><BrainCircuit /><p>Loading your Twin memory…</p></main><AppDock language={supportLanguage} /></div></div>;
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
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Tutor unavailable');
      const detail = payload as TutorResponse;
      const twinTurn: Message = { role: 'twin', text: detail.reply, detail };
      const nextMessages = [...conversationBeforeReply, twinTurn];
      await Promise.all([rememberMistakes(detail, text), persistConversation(nextMessages)]);
      setMessages(nextMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tutor unavailable');
    } finally { setBusy(false); }
  }

  return <div className="app-shell"><div className="phone"><main className="page">
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button>
    <header><div><span className="eyebrow">AI LANGUAGE COACH · LEARNER MEMORY</span><h1>English Twin</h1><p>The Twin uses your level, completed lessons, repeated mistakes, due vocabulary and recent conversation — not a blank chat.</p></div></header>
    {(snapshot.weakSkills.length > 0 || snapshot.dueReviewTerms.length > 0) && <section className="twin-memory-strip">
      <BrainCircuit />
      <div><b>What your Twin is watching</b><p>{snapshot.weakSkills.slice(0, 3).map(item => item.skill).join(' · ') || 'learning progress'}{snapshot.dueReviewTerms.length ? ` · review: ${snapshot.dueReviewTerms.slice(0, 4).join(', ')}` : ''}</p></div>
    </section>}
    <section className="tutor-thread">
      {messages.map((message, index) => <article className={`tutor-message ${message.role}`} key={`${message.role}-${index}`}>
        <span>{message.role === 'twin' ? 'TWIN' : 'YOU'}</span>
        <p>{message.text}</p>
        {message.detail?.correction && <div className="tutor-correction"><Sparkles /><div><b>More natural</b><p>{message.detail.correction}</p>{message.detail.explanation && <small>{message.detail.explanation}</small>}</div></div>}
        {message.detail?.detectedMistakes?.length ? <div className="tutor-mistakes">{message.detail.detectedMistakes.map((mistake, i) => <div key={i}><del>{mistake.original}</del><b>{mistake.corrected}</b><small>{mistake.reason}</small></div>)}</div> : null}
        {message.detail?.suggestedReply && <button className="ghost tutor-suggestion" onClick={() => setInput(message.detail!.suggestedReply!)}>Try: “{message.detail.suggestedReply}”</button>}
      </article>)}
      {busy && <article className="tutor-message twin"><span>TWIN</span><p>Reading your learning context and preparing the next useful step…</p></article>}
    </section>
    {error && <p className="error">{error}</p>}
    <form className="tutor-composer" onSubmit={send}>
      <input value={input} onChange={event => setInput(event.target.value)} maxLength={1200} placeholder="Say something in English…" aria-label="Message your English Twin" />
      <button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send /></button>
    </form>
  </main><AppDock language={supportLanguage} /></div></div>;
}
