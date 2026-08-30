import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { BookOpen, BrainCircuit, ChevronRight, Gauge, Home, Mic, RotateCcw, Settings, Sparkles, UserRound } from 'lucide-react';
import { auth, db } from './firebase';
import { lessons } from './curriculum';
import { loadLessonProgress, ProgressMap, summarizeProgress } from './learning';
import { dueCards, ensureReviewCards } from './review';

type LearnerProfile = {
  displayName?: string;
  learningGoal?: string;
  dailyTargetMinutes?: number;
  onboardingCompleted?: boolean;
  placementLevel?: string;
};

type Recommendation = {
  kind: 'assessment' | 'review' | 'lesson' | 'speak';
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  to: string;
};

function Dock() {
  return (
    <nav className="dock">
      {[
        ['/', Home, 'Home'],
        ['/learn', BookOpen, 'Learn'],
        ['/practice', Gauge, 'Practice'],
        ['/speak', Mic, 'Speak'],
        ['/profile', UserRound, 'Me'],
      ].map(([to, Icon, label]: any) => (
        <NavLink end={to === '/'} key={to} to={to}><Icon /><small>{label}</small></NavLink>
      ))}
    </nav>
  );
}

export default function SmartHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setLoading(true);
    setUser(current);
    if (!current) {
      setProfile(null);
      setProgress({});
      setDueCount(0);
      setLoading(false);
      return;
    }

    try {
      const [profileSnap, learnerProgress] = await Promise.all([
        getDoc(doc(db, 'users', current.uid)),
        loadLessonProgress(current.uid),
      ]);
      const nextProfile = profileSnap.exists() ? profileSnap.data() as LearnerProfile : {};
      setProfile(nextProfile);
      setProgress(learnerProgress);

      const completedIds = Object.values(learnerProgress)
        .filter(item => item.completed)
        .map(item => item.lessonId);
      const cards = await ensureReviewCards(current.uid, completedIds);
      setDueCount(dueCards(cards).length);
    } catch {
      setDueCount(0);
    } finally {
      setLoading(false);
    }
  }), []);

  const nextLesson = useMemo(() => lessons.find(lesson => !progress[lesson.id]?.completed), [progress]);
  const summary = useMemo(() => summarizeProgress(progress, lessons.length), [progress]);

  const recommendation: Recommendation = useMemo(() => {
    if (!profile?.placementLevel) {
      return {
        kind: 'assessment',
        eyebrow: 'FIRST SIGNAL',
        title: 'Measure before the Twin adapts.',
        body: 'Take the deterministic CEFR diagnostic so the learning engine has real evidence instead of guessing your level.',
        action: 'Take placement test',
        to: '/assessment',
      };
    }
    if (dueCount > 0) {
      return {
        kind: 'review',
        eyebrow: 'MEMORY PRIORITY',
        title: `${dueCount} review${dueCount === 1 ? '' : 's'} are due now.`,
        body: 'FSRS says these items should be recalled now before they become harder to retrieve.',
        action: 'Review now',
        to: '/review',
      };
    }
    if (nextLesson) {
      return {
        kind: 'lesson',
        eyebrow: 'NEXT BEST STEP',
        title: nextLesson.title,
        body: `${nextLesson.objective} · ${nextLesson.minutes} min`,
        action: 'Continue lesson',
        to: `/lesson/${nextLesson.id}`,
      };
    }
    return {
      kind: 'speak',
      eyebrow: 'TRANSFER TO SPEECH',
      title: 'Use what you learned in conversation.',
      body: 'Your current structured path is complete. Move the knowledge into active recall and speech.',
      action: 'Open speaking lab',
      to: '/speak',
    };
  }, [profile?.placementLevel, dueCount, nextLesson]);

  if (loading) {
    return <main className="center wake"><BrainCircuit /><p>Reading your learning state…</p></main>;
  }
  if (!user) return <Navigate to="/welcome" replace />;
  if (!profile?.onboardingCompleted) return <Navigate to="/setup" replace />;

  return (
    <div className="app-shell">
      <div className="phone">
        <main className="page">
          <header className="home-header">
            <div>
              <span className="eyebrow">ENGLISH TWIN · ADAPTIVE HOME</span>
              <h1>{profile.displayName || user.displayName || 'Learner'}</h1>
              <p>{profile.learningGoal || 'Personal English'} · {profile.dailyTargetMinutes || 15} min daily</p>
            </div>
            <button className="icon" onClick={() => navigate('/profile')} aria-label="Open profile"><Settings /></button>
          </header>

          <section className="twin-stage">
            <div className="twin-copy">
              <span className="status-dot">{recommendation.eyebrow}</span>
              <h2>{recommendation.title}</h2>
              <p>{recommendation.body}</p>
              <div className="hero-actions">
                <button className="primary lime" onClick={() => navigate(recommendation.to)}>
                  {recommendation.kind === 'review' ? <RotateCcw /> : recommendation.kind === 'assessment' ? <Gauge /> : recommendation.kind === 'speak' ? <Mic /> : <BookOpen />}
                  {recommendation.action}
                </button>
                <button className="ghost" onClick={() => navigate('/practice')}>Practice hub <ChevronRight /></button>
              </div>
            </div>
            <div className="twin idle" aria-label="English Twin ready">
              <div className="twin-aura" />
              <div className="twin-orbit orbit-a" />
              <div className="twin-orbit orbit-b" />
              <div className="twin-core"><span className="twin-eye left" /><span className="twin-eye right" /><i className="twin-mouth" /></div>
              <div className="twin-wave"><i /><i /><i /><i /><i /></div>
            </div>
          </section>

          <section>
            <div className="section-heading"><span>WHY THIS STEP</span><h3>Recommendation signals</h3></div>
            <div className="daily-plan">
              <button onClick={() => navigate('/assessment')}>
                <span className="plan-no">01</span>
                <div><b>Placement</b><small>{profile.placementLevel ? `Measured level: ${profile.placementLevel}` : 'Not measured yet'}</small></div>
                <ChevronRight />
              </button>
              <button onClick={() => navigate('/review')}>
                <span className="plan-no">02</span>
                <div><b>Memory</b><small>{dueCount ? `${dueCount} cards due now` : 'No review currently due'}</small></div>
                <ChevronRight />
              </button>
              <button onClick={() => nextLesson && navigate(`/lesson/${nextLesson.id}`)} disabled={!nextLesson}>
                <span className="plan-no">03</span>
                <div><b>Curriculum</b><small>{nextLesson ? nextLesson.title : 'Current path complete'}</small></div>
                <ChevronRight />
              </button>
            </div>
          </section>

          <section>
            <div className="section-heading"><span>EVIDENCE</span><h3>Real learning state</h3></div>
            {summary.completed ? (
              <div className="metric-strip">
                <div><strong>{summary.completed}</strong><span>Lessons</span></div>
                <div><strong>{summary.average}%</strong><span>Avg. score</span></div>
                <div><strong>{summary.percent}%</strong><span>Path</span></div>
              </div>
            ) : (
              <div className="signal-empty"><Sparkles /><div><b>No invented progress.</b><p>Complete real activities and the dashboard will update from stored learner data.</p></div></div>
            )}
          </section>
        </main>
        <Dock />
      </div>
    </div>
  );
}
