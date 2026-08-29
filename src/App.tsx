import { FormEvent, useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  Compass,
  Gauge,
  Headphones,
  Home as HomeIcon,
  Languages,
  LogOut,
  MessageCircleMore,
  Mic,
  RotateCcw,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Volume2,
  XCircle,
} from 'lucide-react';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';
import { Activity, lessonById, lessons, lessonsForUnit, units } from './curriculum';
import { loadLessonProgress, ProgressMap, saveLessonCompletion, summarizeProgress } from './learning';

type Profile = {
  displayName: string;
  interfaceLanguage: string;
  nativeLanguage: string;
  learningGoal: string;
  cefrLevel: string;
  dailyTargetMinutes: number;
  onboardingCompleted: boolean;
};

type TwinState = 'idle' | 'listening' | 'thinking' | 'speaking';

const defaultProfile: Profile = {
  displayName: 'Learner',
  interfaceLanguage: 'English',
  nativeLanguage: 'Arabic',
  learningGoal: 'Daily conversation',
  cefrLevel: 'A1',
  dailyTargetMinutes: 15,
  onboardingCompleted: false,
};

function Twin({ state = 'idle', compact = false }: { state?: TwinState; compact?: boolean }) {
  return (
    <div className={`twin ${state} ${compact ? 'compact' : ''}`} aria-label={`English Twin ${state}`}>
      <div className="twin-aura" />
      <div className="twin-orbit orbit-a" />
      <div className="twin-orbit orbit-b" />
      <div className="twin-core">
        <span className="twin-eye left" />
        <span className="twin-eye right" />
        <i className="twin-mouth" />
      </div>
      <div className="twin-wave"><i /><i /><i /><i /><i /></div>
    </div>
  );
}

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async currentUser => {
        setLoading(true);
        setUser(currentUser);
        try {
          if (!currentUser) {
            setProfile(null);
            setProgress({});
            return;
          }
          const [profileSnap, learnerProgress] = await Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            loadLessonProgress(currentUser.uid),
          ]);
          setProfile(
            profileSnap.exists()
              ? (profileSnap.data() as Profile)
              : {
                  ...defaultProfile,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Learner',
                },
          );
          setProgress(learnerProgress);
        } finally {
          setLoading(false);
        }
      }),
    [],
  );

  const save = async (nextProfile: Profile) => {
    if (!user) return;
    await setDoc(
      doc(db, 'users', user.uid),
      {
        ...nextProfile,
        email: user.email,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setProfile(nextProfile);
  };

  return { user, profile, progress, setProgress, loading, save };
}

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const created = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(created.user, { displayName: name });
        await setDoc(doc(db, 'users', created.user.uid), {
          ...defaultProfile,
          displayName: name || email.split('@')[0],
          email,
          uid: created.user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (error: any) {
      setNotice(error.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="center">
        <section className="auth-card setup-card">
          <Twin compact />
          <span className="eyebrow">ONE-TIME SETUP</span>
          <h1>English Twin</h1>
          <p>Connect Firebase once to activate real accounts, sessions and learner data.</p>
          <code>Add the VITE_FIREBASE_* values from .env.example</code>
        </section>
      </main>
    );
  }

  return (
    <main className="center auth-stage">
      <section className="auth-card">
        <div className="auth-brand">
          <Twin compact />
          <div>
            <span className="eyebrow">PERSONAL ENGLISH OS</span>
            <h1>English Twin</h1>
            <p>Structured lessons, intelligent practice and a voice-first coach in one place.</p>
          </div>
        </div>
        <div className="seg">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'register' && <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
          {notice && <p className="error">{notice}</p>}
          <button className="primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button
          className="google"
          disabled={busy}
          onClick={async () => {
            setNotice('');
            setBusy(true);
            try {
              await signInWithPopup(auth, googleProvider);
              navigate('/');
            } catch (error: any) {
              setNotice(error.message || 'Google sign-in failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          Continue with Google
        </button>
        {mode === 'login' && (
          <button
            className="text"
            onClick={async () => {
              if (!email) return setNotice('Enter your email first');
              try {
                await sendPasswordResetEmail(auth, email);
                setNotice('Password reset email sent.');
              } catch (error: any) {
                setNotice(error.message || 'Could not send reset email');
              }
            }}
          >
            Forgot password?
          </button>
        )}
      </section>
    </main>
  );
}

function Onboarding({ profile, save }: { profile: Profile; save: (profile: Profile) => Promise<void> }) {
  const [draft, setDraft] = useState(profile);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const steps = [
    <>
      <span className="eyebrow">01 / GOAL</span>
      <h2>What should English unlock for you?</h2>
      {['Daily conversation', 'Work', 'Travel', 'Study', 'Moving abroad'].map(option => (
        <Choice key={option} on={() => setDraft({ ...draft, learningGoal: option })} active={draft.learningGoal === option}>{option}</Choice>
      ))}
    </>,
    <>
      <span className="eyebrow">02 / LEVEL</span>
      <h2>Where are you starting today?</h2>
      {['A1', 'A2', 'B1', 'B2', 'C1'].map(option => (
        <Choice key={option} on={() => setDraft({ ...draft, cefrLevel: option })} active={draft.cefrLevel === option}>{option}</Choice>
      ))}
    </>,
    <>
      <span className="eyebrow">03 / RHYTHM</span>
      <h2>Choose a daily rhythm you can keep.</h2>
      {[5, 10, 15, 20, 30].map(option => (
        <Choice key={option} on={() => setDraft({ ...draft, dailyTargetMinutes: option })} active={draft.dailyTargetMinutes === option}>{option} minutes</Choice>
      ))}
    </>,
  ];

  return (
    <main className="center onboarding-stage">
      <section className="onboard">
        <Twin compact />
        {steps[step]}
        <div className="row">
          <button className="secondary" disabled={!step || busy} onClick={() => setStep(step - 1)}>Back</button>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              if (step < steps.length - 1) return setStep(step + 1);
              setBusy(true);
              try {
                await save({ ...draft, onboardingCompleted: true });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Saving…' : step < steps.length - 1 ? 'Continue' : 'Enter English Twin'}
          </button>
        </div>
      </section>
    </main>
  );
}

function Choice({ children, active, on }: { children: any; active: boolean; on: () => void }) {
  return <button className={`choice ${active ? 'active' : ''}`} onClick={on}>{children}<span>{active ? '✓' : '›'}</span></button>;
}

function Shell({ user, profile, progress, setProgress }: { user: User; profile: Profile; progress: ProgressMap; setProgress: (progress: ProgressMap) => void }) {
  return (
    <div className="app-shell">
      <div className="phone">
        <Routes>
          <Route path="/" element={<Home profile={profile} progress={progress} />} />
          <Route path="/learn" element={<Learn progress={progress} />} />
          <Route path="/practice" element={<Practice progress={progress} />} />
          <Route path="/lesson/:lessonId" element={<LessonPlayer uid={user.uid} progress={progress} setProgress={setProgress} />} />
          <Route path="/speak" element={<Speak />} />
          <Route path="/progress" element={<Progress profile={profile} progress={progress} />} />
          <Route path="/profile" element={<ProfilePage profile={profile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <nav className="dock">
          {[
            ['/', HomeIcon, 'Home'],
            ['/learn', BookOpen, 'Learn'],
            ['/practice', Gauge, 'Practice'],
            ['/speak', Mic, 'Speak'],
            ['/profile', UserRound, 'Me'],
          ].map(([to, Icon, label]: any) => (
            <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Home({ profile, progress }: { profile: Profile; progress: ProgressMap }) {
  const navigate = useNavigate();
  const summary = summarizeProgress(progress, lessons.length);
  const next = lessons.find(lesson => !progress[lesson.id]?.completed);
  const completedVocabulary = lessons.filter(lesson => lesson.skill === 'Vocabulary' && progress[lesson.id]?.completed).length;

  return (
    <Page>
      <header className="home-header">
        <div>
          <span className="eyebrow">ENGLISH TWIN</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.learningGoal} · {profile.dailyTargetMinutes} min daily</p>
        </div>
        <button className="icon" onClick={() => navigate('/profile')}><Settings /></button>
      </header>

      <section className="twin-stage">
        <div className="twin-copy">
          <span className="status-dot">AI COACH READY</span>
          <h2>{next ? `Your next move: ${next.title}.` : 'Your A1 starter path is complete.'}</h2>
          <p>{next ? next.objective : 'Continue with practice and speaking while the next CEFR path is prepared.'}</p>
          <div className="hero-actions">
            <button className="primary lime" onClick={() => navigate('/speak')}><Mic /> Talk now</button>
            {next && <button className="ghost" onClick={() => navigate(`/lesson/${next.id}`)}>Continue lesson <ChevronRight /></button>}
          </div>
        </div>
        <Twin />
      </section>

      <section>
        <SectionTitle kicker="TODAY" title="One clear plan" />
        <div className="daily-plan">
          <button onClick={() => next && navigate(`/lesson/${next.id}`)} disabled={!next}>
            <span className="plan-no">01</span>
            <div><b>{next ? next.title : 'A1 complete'}</b><small>{next ? `${next.skill} · ${next.minutes} min` : 'No unfinished starter lesson'}</small></div>
            <ChevronRight />
          </button>
          <button onClick={() => navigate('/practice')}>
            <span className="plan-no">02</span>
            <div><b>Practice</b><small>{completedVocabulary ? 'Review and reinforce what you studied' : 'Unlock review by completing vocabulary lessons'}</small></div>
            <ChevronRight />
          </button>
          <button onClick={() => navigate('/speak')}>
            <span className="plan-no">03</span>
            <div><b>Speak with your Twin</b><small>Voice-first conversation space</small></div>
            <ChevronRight />
          </button>
        </div>
      </section>

      <section>
        <SectionTitle kicker="SIGNALS" title="Learning state" />
        {summary.completed ? (
          <div className="metric-strip">
            <div><strong>{summary.completed}</strong><span>Lessons</span></div>
            <div><strong>{summary.average}%</strong><span>Avg. score</span></div>
            <div><strong>{summary.percent}%</strong><span>A1 path</span></div>
          </div>
        ) : (
          <div className="signal-empty"><BrainCircuit /><div><b>Your learning engine starts with evidence.</b><p>Finish real activities first; English Twin will never invent progress.</p></div></div>
        )}
      </section>

      <button className="progress-link" onClick={() => navigate('/progress')}><ChartNoAxesCombined /> View full progress <ChevronRight /></button>
    </Page>
  );
}

function Learn({ progress }: { progress: ProgressMap }) {
  const navigate = useNavigate();
  const summary = summarizeProgress(progress, lessons.length);
  return (
    <Page>
      <header>
        <div>
          <span className="eyebrow">STRUCTURED PATH</span>
          <h1>Learn</h1>
          <p>CEFR-aligned lessons with a visible next step.</p>
        </div>
      </header>
      <div className="learn-overview">
        <div><span>A1 · Foundations</span><strong>{summary.percent}%</strong></div>
        <div className="thin-progress"><i style={{ width: `${summary.percent}%` }} /></div>
        <small>{summary.completed} of {summary.total} starter lessons completed</small>
      </div>
      <div className="journey">
        {units.map((unit, unitIndex) => (
          <section className="journey-unit" key={unit.id}>
            <div className="journey-marker"><span>{unitIndex + 1}</span></div>
            <div className="journey-content">
              <div className="unit-label"><small>UNIT {String(unitIndex + 1).padStart(2, '0')}</small><h3>{unit.title}</h3></div>
              <div className="lesson-rows">
                {lessonsForUnit(unit.id).map(lesson => {
                  const result = progress[lesson.id];
                  return (
                    <button key={lesson.id} onClick={() => navigate(`/lesson/${lesson.id}`)}>
                      <div><b>{lesson.title}</b><small>{lesson.skill} · {lesson.minutes} min</small></div>
                      <span className={result?.completed ? 'done' : ''}>{result?.completed ? `${result.score}%` : 'Start'} <ChevronRight /></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

function Practice({ progress }: { progress: ProgressMap }) {
  const navigate = useNavigate();
  const firstIncomplete = lessons.find(lesson => !progress[lesson.id]?.completed);
  const completedVocabulary = lessons.filter(lesson => lesson.skill === 'Vocabulary' && progress[lesson.id]?.completed);
  const grammarTarget = lessons.find(lesson => lesson.skill === 'Grammar' && !progress[lesson.id]?.completed) || lessons.find(lesson => lesson.skill === 'Grammar');
  const realLifeTarget = lessonById('a1-u4-l2');

  return (
    <Page>
      <header>
        <div>
          <span className="eyebrow">TRAIN THE SKILL</span>
          <h1>Practice</h1>
          <p>Short modes for recall, grammar and real-life use.</p>
        </div>
      </header>

      <section className="practice-feature">
        <div>
          <span className="eyebrow">QUICK MIX</span>
          <h2>{firstIncomplete ? 'Keep momentum with the next unfinished activity.' : 'Your starter path is complete.'}</h2>
          <p>{firstIncomplete ? `${firstIncomplete.title} · ${firstIncomplete.minutes} min` : 'Use speaking and review while your next path unlocks.'}</p>
        </div>
        <button className="round-action" disabled={!firstIncomplete} onClick={() => firstIncomplete && navigate(`/lesson/${firstIncomplete.id}`)}><ChevronRight /></button>
      </section>

      <div className="practice-grid">
        <button
          className="practice-tile"
          disabled={!completedVocabulary.length}
          onClick={() => completedVocabulary.length && navigate(`/lesson/${completedVocabulary[0].id}`)}
        >
          <RotateCcw />
          <span>Recall</span>
          <h3>Vocabulary review</h3>
          <p>{completedVocabulary.length ? `${completedVocabulary.length} learned vocabulary lessons available to revisit.` : 'Complete a vocabulary lesson to unlock review.'}</p>
        </button>
        <button className="practice-tile" disabled={!grammarTarget} onClick={() => grammarTarget && navigate(`/lesson/${grammarTarget.id}`)}>
          <Sparkles />
          <span>Build</span>
          <h3>Grammar focus</h3>
          <p>Reinforce sentence patterns using your real lesson engine.</p>
        </button>
        <button className="practice-tile" disabled={!realLifeTarget} onClick={() => realLifeTarget && navigate(`/lesson/${realLifeTarget.id}`)}>
          <Compass />
          <span>Use</span>
          <h3>Real-life English</h3>
          <p>Practice useful language for everyday situations.</p>
        </button>
        <button className="practice-tile" onClick={() => navigate('/speak')}>
          <Mic />
          <span>Talk</span>
          <h3>Voice lab</h3>
          <p>Move from exercises to spontaneous conversation.</p>
        </button>
      </div>
    </Page>
  );
}

function LessonPlayer({ uid, progress, setProgress }: { uid: string; progress: ProgressMap; setProgress: (progress: ProgressMap) => void }) {
  const { lessonId = '' } = useParams();
  const lesson = lessonById(lessonId);
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [fill, setFill] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!lesson) return <Page><button className="back" onClick={() => navigate('/learn')}><ArrowLeft /> Back</button><h2>Lesson not found</h2></Page>;

  const activity = lesson.activities[index];
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / lesson.activities.length) * 100);

  async function finish(nextCorrect = correct, nextTotal = total) {
    setSaving(true);
    try {
      const saved = await saveLessonCompletion(uid, lesson.id, nextCorrect, nextTotal);
      setProgress({ ...progress, [lesson.id]: saved });
      setFinished(true);
    } finally {
      setSaving(false);
    }
  }

  function advance() {
    setFeedback(null);
    setSelected('');
    setFill('');
    if (index >= lesson.activities.length - 1) void finish();
    else setIndex(index + 1);
  }

  function check() {
    if (activity.type === 'explain') return advance();
    const answer = activity.type === 'choice' ? selected : fill.trim();
    if (!answer) return;
    const ok = answer.toLocaleLowerCase() === activity.answer.toLocaleLowerCase();
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextTotal = total + 1;
    setCorrect(nextCorrect);
    setTotal(nextTotal);
    setFeedback({ ok, text: activity.explanation });
    if (index >= lesson.activities.length - 1) setTimeout(() => void finish(nextCorrect, nextTotal), 350);
  }

  if (finished) {
    const score = total ? Math.round((correct / total) * 100) : 100;
    return (
      <Page>
        <button className="back" onClick={() => navigate('/learn')}><ArrowLeft /> Learn</button>
        <section className="lesson-complete"><CheckCircle2 /><span className="eyebrow">LESSON COMPLETE</span><h1>{lesson.title}</h1><strong>{score}%</strong><p>{correct} correct out of {total} scored activities.</p><button className="primary" onClick={() => navigate('/learn')}>Continue roadmap</button></section>
      </Page>
    );
  }

  return (
    <Page>
      <button className="back" onClick={() => navigate('/learn')}><ArrowLeft /> Exit lesson</button>
      <div className="lesson-top"><div><span className="eyebrow">{lesson.skill.toUpperCase()} · {lesson.minutes} MIN</span><h1>{lesson.title}</h1><p>{lesson.objective}</p></div><span>{index + 1}/{lesson.activities.length}</span></div>
      <div className="progress-track"><i style={{ width: `${progressPercent}%` }} /></div>
      <section className="activity-card">
        {renderActivity(activity, selected, setSelected, fill, setFill)}
        {feedback && <div className={`feedback ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.ok ? <CheckCircle2 /> : <XCircle />}<div><b>{feedback.ok ? 'Correct' : 'Not quite'}</b><p>{feedback.text}</p></div></div>}
        <button className="primary activity-action" disabled={saving || Boolean(feedback && index >= lesson.activities.length - 1)} onClick={feedback ? advance : check}>{saving ? 'Saving…' : feedback ? 'Continue' : activity.type === 'explain' ? 'Continue' : 'Check answer'}</button>
      </section>
    </Page>
  );
}

function renderActivity(activity: Activity, selected: string, setSelected: (value: string) => void, fill: string, setFill: (value: string) => void) {
  if (activity.type === 'explain') {
    return <div className="explain"><span className="eyebrow">LEARN</span><h2>{activity.title}</h2><p>{activity.body}</p><div className="examples">{activity.examples.map(example => <div key={example}>{example}</div>)}</div></div>;
  }
  if (activity.type === 'choice') {
    return <div><span className="eyebrow">CHOOSE THE BEST ANSWER</span><h2>{activity.prompt}</h2><div className="answer-list">{activity.options.map(option => <button className={selected === option ? 'selected' : ''} key={option} onClick={() => setSelected(option)}>{option}</button>)}</div></div>;
  }
  return <div><span className="eyebrow">COMPLETE THE SENTENCE</span><h2>{activity.prompt}</h2><input className="lesson-input" value={fill} onChange={event => setFill(event.target.value)} placeholder={activity.hint || 'Type your answer'} /></div>;
}

function Speak() {
  const [state, setState] = useState<TwinState>('idle');
  const copy: Record<TwinState, { label: string; title: string; text: string }> = {
    idle: { label: 'READY', title: 'Say something real.', text: 'Start a voice session when the Gemini Live service is connected.' },
    listening: { label: 'LISTENING', title: 'I’m listening.', text: 'This interface state is ready for live microphone input.' },
    thinking: { label: 'THINKING', title: 'Processing your English.', text: 'The final service will evaluate meaning, grammar and naturalness.' },
    speaking: { label: 'SPEAKING', title: 'Your Twin is replying.', text: 'Live audio playback will use the secure Gemini voice path.' },
  };
  const current = copy[state];
  const cycle = () => setState(state === 'idle' ? 'listening' : state === 'listening' ? 'thinking' : state === 'thinking' ? 'speaking' : 'idle');

  return (
    <Page>
      <header>
        <div><span className="eyebrow">VOICE-FIRST COACH</span><h1>Speak</h1><p>A dedicated space for natural conversation, not another chat box.</p></div>
      </header>
      <section className={`voice-stage ${state}`}>
        <div className="voice-top"><span className="voice-status">{current.label}</span><span>Gemini Live foundation</span></div>
        <Twin state={state} />
        <div className="voice-copy"><h2>{current.title}</h2><p>{current.text}</p></div>
        <button className="voice-button" onClick={cycle}><Mic /></button>
        <small>Tap to preview interaction states. Production audio is not faked.</small>
      </section>
      <div className="scenario-strip">
        <button><MessageCircleMore /><span><b>Open conversation</b><small>Talk about your day</small></span></button>
        <button><Volume2 /><span><b>Pronunciation</b><small>Repeat and refine</small></span></button>
        <button><Headphones /><span><b>Listen & respond</b><small>Train comprehension</small></span></button>
      </div>
    </Page>
  );
}

function Progress({ profile, progress }: { profile: Profile; progress: ProgressMap }) {
  const summary = summarizeProgress(progress, lessons.length);
  const skillTotals = lessons.reduce<Record<string, { total: number; completed: number }>>((acc, lesson) => {
    acc[lesson.skill] ||= { total: 0, completed: 0 };
    acc[lesson.skill].total += 1;
    if (progress[lesson.id]?.completed) acc[lesson.skill].completed += 1;
    return acc;
  }, {});

  return (
    <Page>
      <header><div><span className="eyebrow">REAL LEARNING DATA</span><h1>Progress</h1><p>Only completed activity is counted here.</p></div></header>
      <section className="progress-hero"><div className="level-orb">{profile.cefrLevel}</div><div><span>Current self-reported level</span><h2>{profile.cefrLevel} foundations</h2><p>{summary.completed} of {summary.total} starter lessons completed.</p></div></section>
      <div className="metric-strip progress-metrics"><div><strong>{summary.percent}%</strong><span>Path</span></div><div><strong>{summary.average}%</strong><span>Average</span></div><div><strong>{summary.completed}</strong><span>Lessons</span></div></div>
      <section>
        <SectionTitle kicker="SKILLS" title="What you actually practiced" />
        <div className="skill-list">
          {Object.entries(skillTotals).map(([skill, values]) => {
            const percent = values.total ? Math.round((values.completed / values.total) * 100) : 0;
            return <div key={skill}><div><b>{skill}</b><span>{values.completed}/{values.total}</span></div><div className="skill-line"><i style={{ width: `${percent}%` }} /></div></div>;
          })}
        </div>
      </section>
    </Page>
  );
}

function ProfilePage({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  return (
    <Page>
      <header><div><span className="eyebrow">YOUR SPACE</span><h1>Profile</h1></div></header>
      <section className="profile-identity"><Twin compact /><div><h2>{profile.displayName}</h2><p>{profile.cefrLevel} · {profile.learningGoal}</p></div></section>
      <div className="settings-list">
        <button onClick={() => navigate('/progress')}><Trophy /><div><b>Progress</b><small>Real completed activity and skill coverage</small></div><ChevronRight /></button>
        <button><Languages /><div><b>Interface language</b><small>{profile.interfaceLanguage}</small></div><ChevronRight /></button>
        <button><Target /><div><b>Daily target</b><small>{profile.dailyTargetMinutes} minutes</small></div><ChevronRight /></button>
        <button><Settings /><div><b>Preferences</b><small>Audio, notifications, privacy</small></div><ChevronRight /></button>
        <button className="danger" onClick={() => signOut(auth)}><LogOut /><div><b>Sign out</b></div></button>
      </div>
    </Page>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return <div className="section-heading"><span>{kicker}</span><h3>{title}</h3></div>;
}

function Page({ children }: { children: any }) {
  return <main className="page">{children}</main>;
}

export default function App() {
  const { user, profile, progress, setProgress, loading, save } = useSession();
  if (loading) return <main className="center wake"><Twin state="thinking" /><p>Waking your English Twin…</p></main>;
  if (!user) return <Routes><Route path="*" element={<Auth />} /></Routes>;
  if (!profile || !profile.onboardingCompleted) return <Onboarding profile={profile || defaultProfile} save={save} />;
  return <Shell user={user} profile={profile} progress={progress} setProgress={setProgress} />;
}
