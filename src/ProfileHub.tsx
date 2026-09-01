import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { deleteUser, onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, BookOpen, BrainCircuit, ChevronRight, Gauge, Home, Languages, LogOut, Mic, Save, Target, Trash2, UserRound } from 'lucide-react';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage } from './languageSupport';

type SupportedLanguage = 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';

type LearnerProfile = {
  displayName?: string;
  interfaceLanguage?: SupportedLanguage;
  nativeLanguage?: SupportedLanguage;
  explanationLanguage?: SupportedLanguage;
  learningGoal?: string;
  dailyTargetMinutes?: number;
  cefrLevel?: string;
  placementLevel?: string;
  onboardingCompleted?: boolean;
};

type Mistake = {
  id: string;
  original?: string;
  corrected?: string;
  reason?: string;
  timesSeen?: number;
  source?: 'lesson' | 'twin-coach' | string;
  skill?: string;
  latestExample?: string;
  status?: string;
  lastSeenAt?: { toMillis?: () => number };
};

const languages: SupportedLanguage[] = ['Arabic', 'Dutch', 'French', 'German', 'Spanish', 'English'];
const goals = ['Daily conversation', 'Work', 'Travel', 'Study', 'Moving abroad'];
const rhythms = [5, 10, 15, 20, 30];
const userSubcollections = ['lessonProgress', 'reviewCards', 'reviewLogs', 'mistakes', 'twin', 'learningSessions'];

function Dock() {
  return <nav className="dock">{[
    ['/', Home, 'Home'], ['/learn', BookOpen, 'Learn'], ['/practice', Gauge, 'Practice'], ['/speak', Mic, 'Speak'], ['/profile', UserRound, 'Me'],
  ].map(([to, Icon, label]: any) => <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>)}</nav>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><div className="phone"><main className="page profile-v2">{children}</main><Dock /></div></div>;
}

async function deleteCollectionDocuments(uid: string, name: string) {
  const snapshot = await getDocs(collection(db, 'users', uid, name));
  const docs = snapshot.docs;
  for (let offset = 0; offset < docs.length; offset += 400) {
    const batch = writeBatch(db);
    docs.slice(offset, offset + 400).forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
}

async function deleteLearnerData(uid: string) {
  for (const name of userSubcollections) await deleteCollectionDocuments(uid, name);
  await Promise.all([
    deleteDoc(doc(db, 'learningProfiles', uid)),
    deleteDoc(doc(db, 'users', uid)),
  ]);
}

export function ProfileHub() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearnerProfile>({});
  const [draft, setDraft] = useState<LearnerProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const snap = await getDoc(doc(db, 'users', current.uid));
      const data = snap.exists() ? snap.data() as LearnerProfile : {};
      const normalized: LearnerProfile = {
        displayName: data.displayName || current.displayName || current.email?.split('@')[0] || 'Learner',
        interfaceLanguage: data.interfaceLanguage || 'English',
        nativeLanguage: data.nativeLanguage || 'Arabic',
        explanationLanguage: data.explanationLanguage || data.nativeLanguage || 'Arabic',
        learningGoal: data.learningGoal || 'Daily conversation',
        dailyTargetMinutes: data.dailyTargetMinutes || 15,
        cefrLevel: data.cefrLevel || 'A1',
        placementLevel: data.placementLevel,
        onboardingCompleted: data.onboardingCompleted,
      };
      setProfile(normalized);
      setDraft(normalized);
    } finally { setLoading(false); }
  }), []);

  if (loading) return <Shell><BrainCircuit /><p>Loading profile…</p></Shell>;
  if (!user) return <Navigate to="/welcome" replace />;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setNotice('');
    try {
      const next: LearnerProfile = {
        ...draft,
        displayName: draft.displayName?.trim() || 'Learner',
        nativeLanguage: (draft.nativeLanguage || 'Arabic') as SupportedLanguage,
        explanationLanguage: (draft.explanationLanguage || draft.nativeLanguage || 'Arabic') as SupportedLanguage,
        interfaceLanguage: (draft.interfaceLanguage || 'English') as SupportedLanguage,
        dailyTargetMinutes: Number(draft.dailyTargetMinutes || 15),
      };
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), { ...next, uid: user.uid, email: user.email, updatedAt: serverTimestamp() }, { merge: true }),
        updateProfile(user, { displayName: next.displayName || 'Learner' }),
      ]);
      setProfile(next);
      setDraft(next);
      document.documentElement.lang = next.interfaceLanguage === 'Arabic' ? 'ar' : 'en';
      document.documentElement.dir = directionFor(next.interfaceLanguage || 'English');
      setNotice('Saved');
    } catch {
      setNotice('Could not save profile');
    } finally { setSaving(false); }
  }

  async function removeAccount() {
    if (!user || deleting) return;
    setNotice('');
    setDeleting(true);
    try {
      const token = await user.getIdTokenResult(true);
      const authAgeMs = Date.now() - new Date(token.authTime).getTime();
      if (!Number.isFinite(authAgeMs) || authAgeMs > 5 * 60 * 1000) {
        setNotice('For security, sign out and sign in again before deleting your account. No data was deleted.');
        setConfirmDelete(false);
        return;
      }

      await deleteLearnerData(user.uid);
      await deleteUser(user);
      localStorage.removeItem('english-twin-voice-consent-v1');
      nav('/welcome', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('requires-recent-login')) setNotice('Sign out and sign in again, then retry account deletion.');
      else setNotice('Account deletion could not be completed. Please retry.');
    } finally {
      setDeleting(false);
    }
  }

  const support = normalizeLanguage(draft.explanationLanguage || draft.nativeLanguage);

  return <Shell>
    <header className="home-header"><div><span className="eyebrow">LEARNER PROFILE</span><h1>{profile.displayName || 'Learner'}</h1><p>{user.email}</p></div><button className="icon" onClick={() => nav('/')}><ArrowLeft /></button></header>

    <form className="profile-form" onSubmit={save}>
      <section className="profile-card"><div className="section-heading"><span>IDENTITY</span><h3>Your learning setup</h3></div><label>Name<input value={draft.displayName || ''} onChange={e => setDraft({ ...draft, displayName: e.target.value })} maxLength={60} /></label></section>

      <section className="profile-card"><div className="section-heading"><span>LANGUAGES</span><h3>Support vs target</h3></div><div className="language-summary"><Languages /><div><b>{support} support</b><small>English remains the target language.</small></div></div><label>Native language<select value={draft.nativeLanguage || 'Arabic'} onChange={e => setDraft({ ...draft, nativeLanguage: e.target.value as SupportedLanguage })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label><label>Explanation language<select value={draft.explanationLanguage || draft.nativeLanguage || 'Arabic'} onChange={e => setDraft({ ...draft, explanationLanguage: e.target.value as SupportedLanguage })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label><label>Interface language<select value={draft.interfaceLanguage || 'English'} onChange={e => setDraft({ ...draft, interfaceLanguage: e.target.value as SupportedLanguage })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label></section>

      <section className="profile-card"><div className="section-heading"><span>PLAN</span><h3>Goal and daily rhythm</h3></div><label>Learning goal<select value={draft.learningGoal || 'Daily conversation'} onChange={e => setDraft({ ...draft, learningGoal: e.target.value })}>{goals.map(goal => <option key={goal}>{goal}</option>)}</select></label><label>Daily target<select value={draft.dailyTargetMinutes || 15} onChange={e => setDraft({ ...draft, dailyTargetMinutes: Number(e.target.value) })}>{rhythms.map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><div className="profile-signal"><Target /><div><b>Measured level</b><small>{draft.placementLevel ? `Placement: ${draft.placementLevel}` : `Self-reported: ${draft.cefrLevel || 'A1'}`}</small></div></div></section>

      <button className="primary profile-save" type="submit" disabled={saving}><Save />{saving ? 'Saving…' : 'Save profile'}</button>{notice && <p className={notice === 'Saved' ? 'success' : 'error'}>{notice}</p>}
    </form>

    <button className="progress-link" onClick={() => nav('/mistakes')}><BrainCircuit /> Open Error Memory <ChevronRight /></button>
    <button className="progress-link" onClick={() => nav('/privacy')}>Privacy & AI data <ChevronRight /></button>
    <button className="progress-link" onClick={async () => { await signOut(auth); nav('/welcome'); }}><LogOut /> Sign out <ChevronRight /></button>

    <section className="profile-card">
      <div className="section-heading"><span>DATA CONTROL</span><h3>Delete account</h3></div>
      <p>This permanently removes your English Twin profile, lesson progress, review history, saved mistakes, Twin memory and saved live-speaking transcripts, then deletes your Firebase account.</p>
      {!confirmDelete ? <button className="progress-link" type="button" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete account and learning data <ChevronRight /></button> : <div className="lesson-actions"><button className="ghost" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button><button className="primary" type="button" onClick={() => void removeAccount()} disabled={deleting}><Trash2 />{deleting ? 'Deleting…' : 'Permanently delete'}</button></div>}
    </section>
  </Shell>;
}

export function MistakeMemory() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const snap = await getDocs(collection(db, 'users', current.uid, 'mistakes'));
      const rows = snap.docs.map(item => ({ id: item.id, ...item.data() } as Mistake));
      rows.sort((a, b) => (b.lastSeenAt?.toMillis?.() || 0) - (a.lastSeenAt?.toMillis?.() || 0));
      setMistakes(rows);
    } finally { setLoading(false); }
  }), []);

  const lessonCount = useMemo(() => mistakes.filter(item => item.source === 'lesson').length, [mistakes]);
  const twinCount = useMemo(() => mistakes.filter(item => item.source === 'twin-coach').length, [mistakes]);

  if (loading) return <Shell><BrainCircuit /><p>Reading Error Memory…</p></Shell>;
  if (!user) return <Navigate to="/welcome" replace />;

  return <Shell>
    <button className="back" onClick={() => nav('/profile')}><ArrowLeft /> Profile</button>
    <header><span className="eyebrow">ERROR MEMORY</span><h1>Your recurring mistakes</h1><p>Only mistakes captured from real lessons and Twin Coach appear here.</p></header>
    <div className="metric-strip"><div><strong>{mistakes.length}</strong><span>Total</span></div><div><strong>{lessonCount}</strong><span>Lessons</span></div><div><strong>{twinCount}</strong><span>Twin Coach</span></div></div>
    {!mistakes.length ? <div className="signal-empty"><BrainCircuit /><div><b>No stored mistakes yet.</b><p>Make a real mistake in a scored lesson or Twin Coach and it will appear here.</p></div></div> : <section className="mistake-list">{mistakes.map(item => <article className="mistake-card" key={item.id}><div className="mistake-meta"><span>{item.source === 'lesson' ? 'LESSON' : 'TWIN COACH'}</span>{item.skill && <span>{item.skill}</span>}<span>{item.timesSeen || 1}× seen</span></div><del>{item.original || '—'}</del><b>{item.corrected || '—'}</b>{item.reason && <p>{item.reason}</p>}{item.latestExample && <small>Context: {item.latestExample}</small>}</article>)}</section>}
  </Shell>;
}
