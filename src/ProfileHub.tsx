import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { deleteUser, onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { BrainCircuit, ChevronRight, Languages, LogOut, Save, Target, Trash2 } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, SectionTitle, Surface } from './ui/LearningUI';
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

  const support = normalizeLanguage(draft.explanationLanguage || draft.nativeLanguage || draft.interfaceLanguage || 'English');
  const dir = directionFor(support);

  if (loading) return <LearningShell language={support} dir={dir}><BrainCircuit /><p>Loading profile…</p></LearningShell>;
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
    } finally { setDeleting(false); }
  }

  const measuredLevel = draft.placementLevel || draft.cefrLevel || 'A1';

  return <LearningShell language={support} dir={dir} className="et-profile-shell">
    <PageTitle eyebrow="LEARNER PROFILE" title={profile.displayName || 'Learner'} description={user.email || ''} />

    <Surface className="et-profile-overview" tone="blue">
      <div className="et-profile-avatar">{(profile.displayName || 'L').slice(0,1).toUpperCase()}</div>
      <div><span>Current level</span><h2>{measuredLevel}</h2><p>{draft.learningGoal || 'Daily conversation'} · {draft.dailyTargetMinutes || 15} min/day</p></div>
    </Surface>

    <form className="et-profile-form" onSubmit={save}>
      <Surface>
        <SectionTitle title="Your learning setup" meta="Identity" />
        <label className="et-field">Name<input value={draft.displayName || ''} onChange={e => setDraft({ ...draft, displayName: e.target.value })} maxLength={60} /></label>
      </Surface>

      <Surface>
        <SectionTitle title="Support vs target" meta="Languages" />
        <div className="et-inline-info"><Languages /><div><b>{support} support</b><small>English remains the target language.</small></div></div>
        <label className="et-field">Native language<select value={draft.nativeLanguage || 'Arabic'} onChange={e => setDraft({ ...draft, nativeLanguage: e.target.value as SupportedLanguage })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label>
        <label className="et-field">Explanation language<select value={draft.explanationLanguage || draft.nativeLanguage || 'Arabic'} onChange={e => setDraft({ ...draft, explanationLanguage: e.target.value as SupportedLanguage })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label>
        <label className="et-field">Interface language<select value={draft.interfaceLanguage || 'English'} onChange={e => setDraft({ ...draft, interfaceLanguage: e.target.value as SupportedLanguage })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label>
      </Surface>

      <Surface>
        <SectionTitle title="Goal and daily rhythm" meta="Study plan" />
        <label className="et-field">Learning goal<select value={draft.learningGoal || 'Daily conversation'} onChange={e => setDraft({ ...draft, learningGoal: e.target.value })}>{goals.map(goal => <option key={goal}>{goal}</option>)}</select></label>
        <label className="et-field">Daily target<select value={draft.dailyTargetMinutes || 15} onChange={e => setDraft({ ...draft, dailyTargetMinutes: Number(e.target.value) })}>{rhythms.map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
        <div className="et-inline-info"><Target /><div><b>Measured level</b><small>{draft.placementLevel ? `Placement: ${draft.placementLevel}` : `Self-reported: ${draft.cefrLevel || 'A1'}`}</small></div></div>
      </Surface>

      <ETButton className="et-full" type="submit" disabled={saving}><Save />{saving ? 'Saving…' : 'Save profile'}</ETButton>
      {notice ? <p className={notice === 'Saved' ? 'success' : 'error'}>{notice}</p> : null}
    </form>

    <Surface className="et-settings-list">
      <button onClick={() => nav('/mistakes')}><BrainCircuit /><div><b>Error Memory</b><small>Review recurring mistakes from real practice.</small></div><ChevronRight /></button>
      <button onClick={() => nav('/privacy')}><div><b>Privacy & AI data</b><small>See how voice, progress and AI features use data.</small></div><ChevronRight /></button>
      <button onClick={async () => { await signOut(auth); nav('/welcome'); }}><LogOut /><div><b>Sign out</b></div><ChevronRight /></button>
    </Surface>

    <Surface className="et-danger-zone" tone="danger">
      <SectionTitle title="Delete account" meta="Data control" />
      <p>This permanently removes your profile, lesson progress, review history, mistakes, Twin memory and saved speaking transcripts, then deletes your sign-in account.</p>
      {!confirmDelete ? <ETButton variant="danger" type="button" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete account and learning data</ETButton> : <div className="et-inline-actions"><ETButton variant="ghost" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</ETButton><ETButton variant="danger" type="button" onClick={() => void removeAccount()} disabled={deleting}><Trash2 />{deleting ? 'Deleting…' : 'Permanently delete'}</ETButton></div>}
    </Surface>
  </LearningShell>;
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

  if (loading) return <LearningShell><BrainCircuit /><p>Reading Error Memory…</p></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;

  return <LearningShell className="et-mistake-shell">
    <PageTitle eyebrow="ERROR MEMORY" title="Your recurring mistakes" description="Only mistakes captured from real lessons and Twin Coach appear here." />
    <div className="et-metric-grid"><Surface><strong>{mistakes.length}</strong><span>Total</span></Surface><Surface><strong>{lessonCount}</strong><span>Lessons</span></Surface><Surface><strong>{twinCount}</strong><span>Twin Coach</span></Surface></div>
    {!mistakes.length ? <Surface><BrainCircuit /><h2>No stored mistakes yet.</h2><p>Make a real mistake in a scored lesson or Twin Coach and it will appear here.</p><ETButton variant="secondary" onClick={() => nav('/practice')}>Go to practice</ETButton></Surface> : <div className="et-mistake-list">{mistakes.map(item => <Surface className="et-mistake-card" key={item.id}><div className="et-mistake-meta"><span>{item.source === 'lesson' ? 'LESSON' : 'TWIN COACH'}</span>{item.skill ? <span>{item.skill}</span> : null}<span>{item.timesSeen || 1}× seen</span></div><del>{item.original || '—'}</del><b>{item.corrected || '—'}</b>{item.reason ? <p>{item.reason}</p> : null}{item.latestExample ? <small>Context: {item.latestExample}</small> : null}</Surface>)}</div>}
  </LearningShell>;
}
