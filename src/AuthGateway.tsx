import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';
import { authErrorMessage } from './authErrors';

const defaultProfile = {
  displayName: 'Learner',
  interfaceLanguage: 'English',
  nativeLanguage: 'Arabic',
  instructionLanguage: 'English',
  explanationLanguage: 'Arabic',
  targetLanguage: 'en',
  learningGoal: 'Daily conversation',
  cefrLevel: 'A1',
  dailyTargetMinutes: 15,
  onboardingCompleted: false,
};

function TwinMark() {
  return <div className="twin compact idle" aria-label="English Twin"><div className="twin-aura" /><div className="twin-core"><span className="twin-eye left" /><span className="twin-eye right" /><i className="twin-mouth" /></div></div>;
}

export default function AuthGateway() {
  const navigate = useNavigate();
  const [session, setSession] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, current => { setSession(current); setChecking(false); }), []);

  if (checking) return <main className="center wake"><p>Checking your session…</p></main>;
  if (session) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const created = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(created.user, { displayName: name.trim() });
        await setDoc(doc(db, 'users', created.user.uid), {
          ...defaultProfile,
          displayName: name.trim() || email.split('@')[0],
          email: created.user.email,
          uid: created.user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        navigate('/setup', { replace: true });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/', { replace: true });
      }
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured) {
    return <main className="center"><section className="auth-card setup-card"><TwinMark /><span className="eyebrow">SETUP REQUIRED</span><h1>English Twin</h1><p>Account services are not configured yet. Sign-in and learner data cannot start until setup is complete.</p></section></main>;
  }

  return <main className="center auth-stage"><section className="auth-card">
    <div className="auth-brand"><TwinMark /><div><span className="eyebrow">PERSONAL ENGLISH OS</span><h1>English Twin</h1><p>Structured lessons, intelligent practice and a voice-first coach in one place.</p></div></div>
    <div className="seg"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button></div>
    <form onSubmit={submit}>
      {mode === 'register' && <input autoComplete="name" placeholder="Your name" value={name} onChange={event => setName(event.target.value)} required />}
      <input type="email" autoComplete="email" placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} required />
      <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} required />
      {notice && <p className="error" role="alert">{notice}</p>}
      <button className="primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button className="google" type="button" disabled={busy} onClick={async () => {
      setNotice('');
      setBusy(true);
      try {
        await signInWithPopup(auth, googleProvider);
        navigate('/', { replace: true });
      } catch (error) {
        setNotice(authErrorMessage(error));
      } finally { setBusy(false); }
    }}>Continue with Google</button>
    {mode === 'login' && <button className="text" type="button" onClick={async () => {
      if (!email) { setNotice('Enter your email first'); return; }
      try { await sendPasswordResetEmail(auth, email); setNotice('Password reset email sent.'); }
      catch (error) { setNotice(authErrorMessage(error)); }
    }}>Forgot password?</button>}
    <button className="text" type="button" onClick={() => navigate('/privacy')}>Privacy & AI data</button>
  </section></main>;
}
