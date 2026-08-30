import { FormEvent, useEffect, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, BrainCircuit, Gauge, Home, Mic, Send, Sparkles, UserRound } from 'lucide-react';
import { auth, db } from './firebase';

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
  nativeLanguage?: 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';
  explanationLanguage?: 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';
};

type Message = { role: 'learner' | 'twin'; text: string; detail?: TutorResponse };

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function mistakeKey(original: string, corrected: string, index: number) {
  const safe = `${original}-${corrected}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
  return safe || `mistake-${Date.now()}-${index}`;
}

export default function TutorMode() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'twin', text: 'Tell me something you would actually say in real life. I’ll help you make it sound natural.' },
  ]);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const snap = await getDoc(doc(db, 'users', current.uid));
      if (snap.exists()) setProfile(snap.data() as Profile);
    } finally { setLoading(false); }
  }), []);

  if (loading) return <div className="app-shell"><div className="phone"><main className="page"><BrainCircuit /><p>Loading your Twin…</p></main><Dock /></div></div>;
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
        status: 'active',
      },
      { merge: true },
    )));
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || !user) return;
    setError('');
    setInput('');
    setMessages(current => [...current, { role: 'learner', text }]);
    setBusy(true);
    try {
      const context = messages.slice(-6).map(message => `${message.role}: ${message.text}`);
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
          context,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Tutor unavailable');
      const detail = payload as TutorResponse;
      await rememberMistakes(detail, text);
      setMessages(current => [...current, { role: 'twin', text: detail.reply, detail }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tutor unavailable');
    } finally { setBusy(false); }
  }

  return <div className="app-shell"><div className="phone"><main className="page">
    <button className="back" onClick={() => nav('/practice')}><ArrowLeft /> Practice</button>
    <header><div><span className="eyebrow">AI LANGUAGE COACH</span><h1>Twin Coach</h1><p>Real Gemini feedback, explanations in your support language, and persistent error memory.</p></div></header>
    <section className="tutor-thread">
      {messages.map((message, index) => <article className={`tutor-message ${message.role}`} key={`${message.role}-${index}`}>
        <span>{message.role === 'twin' ? 'TWIN' : 'YOU'}</span>
        <p>{message.text}</p>
        {message.detail?.correction && <div className="tutor-correction"><Sparkles /><div><b>More natural</b><p>{message.detail.correction}</p>{message.detail.explanation && <small>{message.detail.explanation}</small>}</div></div>}
        {message.detail?.detectedMistakes?.length ? <div className="tutor-mistakes">{message.detail.detectedMistakes.map((mistake, i) => <div key={i}><del>{mistake.original}</del><b>{mistake.corrected}</b><small>{mistake.reason}</small></div>)}</div> : null}
        {message.detail?.suggestedReply && <button className="ghost tutor-suggestion" onClick={() => setInput(message.detail!.suggestedReply!)}>Try: “{message.detail.suggestedReply}”</button>}
      </article>)}
      {busy && <article className="tutor-message twin"><span>TWIN</span><p>Thinking about meaning, grammar and naturalness…</p></article>}
    </section>
    {error && <p className="error">{error}</p>}
    <form className="tutor-composer" onSubmit={send}>
      <input value={input} onChange={event => setInput(event.target.value)} maxLength={1200} placeholder="Say something in English…" aria-label="Message your English Twin" />
      <button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send /></button>
    </form>
  </main><Dock /></div></div>;
}
