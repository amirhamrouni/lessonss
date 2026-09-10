import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { ETButton, LearningShell, StatusState } from './ui/LearningUI';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';
import { authErrorMessage } from './authErrors';

declare global {
  interface Window {
    EnglishTwinAndroid?: { signInWithGoogle: () => void };
    __englishTwinNativeGoogleCredential?: (idToken: string) => void;
    __englishTwinNativeGoogleError?: (message: string) => void;
  }
}

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

function BrandMark() {
  return <span className="et-brand-glyph" aria-hidden="true"><i /><i /></span>;
}

async function ensureLearnerProfile(user: User) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return Boolean(snap.data().onboardingCompleted);

  await setDoc(ref, {
    ...defaultProfile,
    displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
    email: user.email,
    uid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return false;
}

export default function AuthGateway() {
  const navigate = useNavigate();
  const [sessionTarget, setSessionTarget] = useState<'/' | '/setup' | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'error' | 'success'>('error');
  const [busy, setBusy] = useState(false);

  function showError(message: string) {
    setNoticeType('error');
    setNotice(message);
  }

  useEffect(() => {
    window.__englishTwinNativeGoogleCredential = idToken => {
      void (async () => {
        try {
          const firebaseCredential = GoogleAuthProvider.credential(idToken);
          const result = await signInWithCredential(auth, firebaseCredential);
          const completed = await ensureLearnerProfile(result.user);
          navigate(completed ? '/' : '/setup', { replace: true });
        } catch (error) {
          showError(authErrorMessage(error));
        } finally {
          setBusy(false);
        }
      })();
    };
    window.__englishTwinNativeGoogleError = message => {
      showError(message || 'Google Sign-In failed.');
      setBusy(false);
    };

    return () => {
      delete window.__englishTwinNativeGoogleCredential;
      delete window.__englishTwinNativeGoogleError;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);
    setSessionError('');
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      if (!current) {
        setSessionTarget(null);
        setChecking(false);
        return;
      }
      try {
        const completed = await ensureLearnerProfile(current);
        if (active) setSessionTarget(completed ? '/' : '/setup');
      } catch {
        if (active) {
          setSessionTarget(null);
          setSessionError('We could not load or create your learner profile. Your account is still signed in and no learning data was overwritten.');
        }
      } finally {
        if (active) setChecking(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadKey]);

  if (checking) {
    return <LearningShell showDock={false} pageClassName="auth-status-page">
      <StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title="Checking your session…" body="Your saved learner profile is being verified before the app opens." />
    </LearningShell>;
  }

  if (!isFirebaseConfigured) {
    return <LearningShell showDock={false} pageClassName="auth-status-page">
      <StatusState icon={<AlertTriangle />} tone="danger" eyebrow="SETUP REQUIRED" title="Account services are not configured" body="Sign-in and learner data cannot start until the Firebase configuration is available." />
    </LearningShell>;
  }

  if (sessionError) {
    return <LearningShell showDock={false} pageClassName="auth-status-page">
      <StatusState
        icon={<AlertTriangle />}
        tone="danger"
        eyebrow="ACCOUNT RECOVERY"
        title="Your learner profile is temporarily unavailable"
        body={sessionError}
        action={<div className="et-inline-actions">
          <ETButton onClick={() => setReloadKey(value => value + 1)}>Try again</ETButton>
          <ETButton variant="secondary" onClick={() => void signOut(auth)}>Sign out</ETButton>
        </div>}
      />
    </LearningShell>;
  }

  if (sessionTarget) return <Navigate to={sessionTarget} replace />;

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
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const completed = await ensureLearnerProfile(credential.user);
        navigate(completed ? '/' : '/setup', { replace: true });
      }
    } catch (error) {
      showError(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setNotice('');
    setBusy(true);

    if (window.EnglishTwinAndroid?.signInWithGoogle) {
      try {
        window.EnglishTwinAndroid.signInWithGoogle();
      } catch (error) {
        showError(authErrorMessage(error));
        setBusy(false);
      }
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const completed = await ensureLearnerProfile(result.user);
      navigate(completed ? '/' : '/setup', { replace: true });
    } catch (error) {
      showError(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return <main className="center auth-stage"><section className="auth-card" aria-busy={busy}>
    <div className="auth-brand"><BrandMark /><div><span className="eyebrow">YOUR PERSONAL ENGLISH COACH</span><h1>English Twin</h1><p>Structured lessons, intelligent review and speaking practice in one place.</p></div></div>
    <div className="seg" role="group" aria-label="Account mode">
      <button type="button" aria-pressed={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setNotice(''); }}>Sign in</button>
      <button type="button" aria-pressed={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setNotice(''); }}>Create account</button>
    </div>
    <form onSubmit={submit}>
      {mode === 'register' && <input autoComplete="name" aria-label="Your name" placeholder="Your name" value={name} onChange={event => setName(event.target.value)} required />}
      <input type="email" autoComplete="email" aria-label="Email" placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} required />
      <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-label="Password" placeholder="Password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} required />
      {notice && <p className={noticeType === 'error' ? 'error' : 'auth-notice'} role={noticeType === 'error' ? 'alert' : 'status'}>{notice}</p>}
      <button className="primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button className="google" type="button" disabled={busy} onClick={() => void googleSignIn()}>Continue with Google</button>
    {mode === 'login' && <button className="text" type="button" disabled={busy} onClick={async () => {
      if (!email) { showError('Enter your email first'); return; }
      setBusy(true);
      setNotice('');
      try {
        await sendPasswordResetEmail(auth, email);
        setNoticeType('success');
        setNotice('Password reset email sent.');
      } catch (error) {
        showError(authErrorMessage(error));
      } finally {
        setBusy(false);
      }
    }}>Forgot password?</button>}
    <button className="text" type="button" disabled={busy} onClick={() => navigate('/privacy')}>Privacy & AI data</button>
  </section></main>;
}
