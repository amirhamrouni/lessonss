import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { BookOpen, CheckCircle2, ChevronRight, LoaderCircle, Mic2, RotateCcw, UserRound } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { lessons, lessonsForLevel } from './curriculumAll';
import { loadLessonProgress, ProgressMap, summarizeProgress } from './learning';
import { dueCards, ensureReviewCards } from './review';
import { buildDailyPlan, SkillLevels, weakestMeasuredSkill } from './adaptiveLearning';
import { directionFor, normalizeLanguage, SupportedLanguage, t } from './languageSupport';

type Profile = {
  displayName?: string;
  learningGoal?: string;
  dailyTargetMinutes?: number;
  onboardingCompleted?: boolean;
  beginnerFoundationCompleted?: boolean;
  nativeLanguage?: string;
  explanationLanguage?: string;
  interfaceLanguage?: string;
  placementLevel?: string;
  skillLevels?: Partial<SkillLevels>;
};

type Recommendation = {
  kind: 'foundation' | 'review' | 'lesson' | 'speak';
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  to: string;
  minutes: number;
};

const copyByLanguage: Record<SupportedLanguage, { weekly:string; weeklyBody:string; continue:string; next:string; foundation:string; review:string; reviewBody:string; speak:string; speakBody:string; start:string }> = {
  English:{weekly:'Your goal this week',weeklyBody:'Complete 5 learning sessions',continue:'Continue lesson',next:'Your best next step today.',foundation:'Pictures, listening, pronunciation and meaning in short steps.',review:'Smart review',reviewBody:'Lock due words into memory before the next lesson.',speak:'Speak with Twin',speakBody:'Turn what you learned into a real conversation.',start:'Start now'},
  Arabic:{weekly:'هدفك هذا الأسبوع',weeklyBody:'أكمل 5 جلسات تعلّم',continue:'متابعة الدرس',next:'خطوتك الأنسب اليوم.',foundation:'تعلّم بالصور والاستماع والنطق والمعنى في خطوات قصيرة.',review:'مراجعة ذكية',reviewBody:'ثبّت الكلمات المستحقة في ذاكرتك قبل الدرس التالي.',speak:'تحدّث مع Twin',speakBody:'حوّل ما تعلمته إلى محادثة حقيقية.',start:'ابدأ الآن'},
  Dutch:{weekly:'Je doel deze week',weeklyBody:'Voltooi 5 leersessies',continue:'Ga verder',next:'Je beste volgende stap voor vandaag.',foundation:'Beelden, luisteren, uitspraak en betekenis in korte stappen.',review:'Slim herhalen',reviewBody:'Zet woorden vast voor je volgende les.',speak:'Spreek met Twin',speakBody:'Maak van wat je leerde een echt gesprek.',start:'Start nu'},
  French:{weekly:'Ton objectif cette semaine',weeklyBody:'Termine 5 sessions',continue:'Continuer',next:'Ta meilleure prochaine étape.',foundation:'Images, écoute, prononciation et sens en petites étapes.',review:'Révision intelligente',reviewBody:'Fixe les mots avant la prochaine leçon.',speak:'Parler avec Twin',speakBody:'Transforme ton apprentissage en conversation.',start:'Commencer'},
  German:{weekly:'Dein Wochenziel',weeklyBody:'5 Lerneinheiten abschließen',continue:'Lektion fortsetzen',next:'Dein bester nächster Schritt.',foundation:'Bilder, Hören, Aussprache und Bedeutung in kurzen Schritten.',review:'Smart wiederholen',reviewBody:'Festige fällige Wörter vor der nächsten Lektion.',speak:'Mit Twin sprechen',speakBody:'Mach aus dem Gelernten ein echtes Gespräch.',start:'Jetzt starten'},
  Spanish:{weekly:'Tu meta esta semana',weeklyBody:'Completa 5 sesiones',continue:'Continuar lección',next:'Tu mejor siguiente paso.',foundation:'Imágenes, escucha, pronunciación y significado en pasos cortos.',review:'Repaso inteligente',reviewBody:'Fija las palabras antes de la siguiente lección.',speak:'Habla con Twin',speakBody:'Convierte lo aprendido en conversación real.',start:'Empezar'},
};

function dateFromTimestamp(value: unknown) {
  const candidate = value as { toDate?: () => Date } | undefined;
  return candidate?.toDate?.() || null;
}

function isThisWeek(value: unknown) {
  const date = dateFromTimestamp(value);
  if (!date) return false;
  const now = new Date();
  const start = new Date(now);
  const day = (now.getDay() + 6) % 7;
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return date >= start && date <= now;
}

export default function SmartHomeV2() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setLoading(true);
    setUser(current);
    if (!current) { setProfile(null); setProgress({}); setDueCount(0); setLoading(false); return; }
    try {
      const [snap, learnerProgress] = await Promise.all([
        getDoc(doc(db, 'users', current.uid)),
        loadLessonProgress(current.uid),
      ]);
      const nextProfile = snap.exists() ? snap.data() as Profile : {};
      setProfile(nextProfile);
      setProgress(learnerProgress);
      const completed = Object.values(learnerProgress).filter(item => item.completed).map(item => item.lessonId);
      const cards = await ensureReviewCards(current.uid, completed);
      setDueCount(dueCards(cards).length);
    } catch { setDueCount(0); }
    finally { setLoading(false); }
  }), []);

  const language = normalizeLanguage(profile?.explanationLanguage || profile?.nativeLanguage || profile?.interfaceLanguage);
  const dir = directionFor(language);
  const ui = copyByLanguage[language];
  const nextLesson = useMemo(() => lessons.find(lesson => !progress[lesson.id]?.completed), [progress]);
  const weakestSkill = useMemo(() => weakestMeasuredSkill(profile?.skillLevels), [profile?.skillLevels]);
  const dailyPlan = useMemo(() => buildDailyPlan({
    dailyTargetMinutes: profile?.dailyTargetMinutes || 15,
    dueReviews: dueCount,
    nextLessonId: nextLesson?.id,
    weakestSkill,
    speakingAvailable: true,
  }), [profile?.dailyTargetMinutes, dueCount, nextLesson?.id, weakestSkill]);
  const a1 = useMemo(() => summarizeProgress(progress, lessonsForLevel('A1').length), [progress]);
  const weeklyCompleted = useMemo(() => Object.values(progress).filter(item => item.completed && isThisWeek(item.completedAt)).length, [progress]);
  const weeklyGoal = 5;
  const weeklyPercent = Math.min(100, Math.round((weeklyCompleted / weeklyGoal) * 100));

  const recommendation: Recommendation = useMemo(() => {
    if (!profile?.beginnerFoundationCompleted) return { kind:'foundation', eyebrow:'A0 → A1', title:t(language,'firstWords'), body:ui.foundation, action:t(language,'startFirstWords'), to:'/start', minutes:5 };
    if (dueCount) return { kind:'review', eyebrow:'FSRS', title:`${dueCount} ${t(language,'reviewDueSuffix')}`, body:ui.reviewBody, action:t(language,'reviewNow'), to:'/review', minutes:3 };
    if (nextLesson) return { kind:'lesson', eyebrow:nextLesson.id.startsWith('a2-')?'A2':'A1', title:nextLesson.title, body:ui.next, action:ui.continue, to:`/lesson/${nextLesson.id}`, minutes:nextLesson.minutes };
    return { kind:'speak', eyebrow:'LIVE', title:ui.speak, body:ui.speakBody, action:ui.start, to:'/speak', minutes:5 };
  }, [profile?.beginnerFoundationCompleted, dueCount, nextLesson, language, ui]);

  function planRoute(id: string, lessonId?: string) {
    if (id === 'review') return '/review';
    if (id === 'lesson' && lessonId) return `/lesson/${lessonId}`;
    if (id === 'speaking') return '/speak';
    return '/practice';
  }

  if (loading) return <main className="center wake" dir={dir} aria-live="polite"><LoaderCircle /><p>{t(language,'loadingState')}</p></main>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!profile?.onboardingCompleted || !profile?.nativeLanguage) return <Navigate to="/setup" replace />;

  const name = profile.displayName || user.displayName || 'Learner';

  return <div className="app-shell reference-home" dir={dir}><div className="phone"><main className="page">
    <header className="reference-app-header">
      <div className="reference-brand"><img src="/icon.svg" alt="" /><div><strong>English <b>Twin</b></strong><small>Your Personal English Coach</small></div></div>
      <button className="profile-avatar" onClick={() => nav('/profile')} aria-label="Profile"><UserRound /></button>
    </header>

    <section className="reference-welcome-card">
      <div className="welcome-avatar"><img src="/icon.svg" alt="" /></div>
      <div><small>{t(language,'greeting')}</small><h1>{name}</h1><p>{t(language,'amazing')}</p></div>
    </section>

    <section className="reference-week-card">
      <div><b>{ui.weekly}</b><span>{weeklyCompleted} / {weeklyGoal}</span><p>{ui.weeklyBody}</p></div>
      <div className="reference-progress"><i style={{width:`${weeklyPercent}%`}} /></div>
    </section>

    <section className={`reference-hero reference-${recommendation.kind}`}>
      <div className="hero-copy">
        <span>{ui.continue}</span>
        <small>{recommendation.eyebrow}</small>
        <h2>{recommendation.title}</h2>
        <p>{recommendation.body}</p>
        <div className="hero-meta"><em>{recommendation.eyebrow}</em><em>{recommendation.minutes} min</em></div>
        <button onClick={() => nav(recommendation.to)}>{recommendation.action}<ChevronRight /></button>
      </div>
      <div className="hero-mascot" aria-hidden="true"><img src="/icon.svg" alt="" /><span /></div>
      <div className="hero-progress"><i style={{width:`${Math.max(8,a1.percent)}%`}} /></div>
    </section>

    <section className="reference-today">
      <div className="reference-section-heading"><h3>{t(language,'todayPlan')}</h3><button onClick={() => nav('/learn')}>{t(language,'seeAll')}</button></div>
      <div className="reference-task-list">
        {(!profile.beginnerFoundationCompleted ? [{id:'foundation',minutes:5,lessonId:undefined}] : dailyPlan.slice(0,3)).map((item:any,index) => {
          const Icon = index === 0 ? BookOpen : index === 1 ? Mic2 : RotateCcw;
          const label = item.id === 'foundation' ? t(language,'startFirstWords') : item.id === 'review' ? t(language,'vocabularyReview') : item.id === 'speaking' ? t(language,'speakWithTwin') : item.id === 'lesson' ? t(language,'nextLesson') : t(language,'smartReview');
          return <button key={`${item.id}-${index}`} onClick={() => nav(item.id === 'foundation' ? '/start' : planRoute(item.id,item.lessonId))}>
            <span className="task-icon"><Icon /></span><div><b>{label}</b><small>{item.minutes || 5} min</small></div>{index === 0 && weeklyCompleted > 0 ? <CheckCircle2 className="task-done" /> : <ChevronRight />}
          </button>;
        })}
      </div>
    </section>
  </main><AppDock language={language}/></div></div>;
}
