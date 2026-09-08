import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { BookOpen, Check, ChevronRight, LoaderCircle, Mic2, RotateCcw, Target, UserRound } from 'lucide-react';
import AppDock from './AppDock';
import { auth, db } from './firebase';
import { lessons } from './curriculumAll';
import { loadLessonProgress, ProgressMap } from './learning';
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

const copyByLanguage: Record<SupportedLanguage, { weekly:string; weeklyBody:string; continue:string; next:string; foundation:string; reviewBody:string; speak:string; speakBody:string; start:string; better:string }> = {
  English:{weekly:'Your goal this week',weeklyBody:'Complete 5 lessons',continue:'Continue lesson',next:'Build confidence with practical English you can use every day.',foundation:'Learn your first useful English through pictures, listening and speaking.',reviewBody:'Lock due words into memory before the next lesson.',speak:'Speak with Twin',speakBody:'Turn what you learned into a real conversation.',start:'Start now',better:'Every day, one step closer to better English'},
  Arabic:{weekly:'هدفك هذا الأسبوع',weeklyBody:'إكمال 5 دروس',continue:'متابعة الدرس',next:'تعلّم الإنجليزية بثقة في مواقف الحياة اليومية.',foundation:'تعلّم أول كلماتك المفيدة بالصور والاستماع والنطق.',reviewBody:'ثبّت الكلمات المستحقة في ذاكرتك قبل الدرس التالي.',speak:'تحدّث مع Twin',speakBody:'حوّل ما تعلمته إلى محادثة حقيقية.',start:'ابدأ الآن',better:'كل يوم خطوة أقرب لإنجليزية أفضل'},
  Dutch:{weekly:'Je doel deze week',weeklyBody:'Voltooi 5 lessen',continue:'Ga verder',next:'Bouw zelfvertrouwen op met praktisch Engels voor elke dag.',foundation:'Leer je eerste nuttige Engelse woorden met beeld, luisteren en spreken.',reviewBody:'Zet woorden vast voor je volgende les.',speak:'Spreek met Twin',speakBody:'Maak van wat je leerde een echt gesprek.',start:'Start nu',better:'Elke dag een stap dichter bij beter Engels'},
  French:{weekly:'Ton objectif cette semaine',weeklyBody:'Termine 5 leçons',continue:'Continuer',next:'Prends confiance avec un anglais pratique du quotidien.',foundation:'Apprends tes premiers mots utiles avec images, écoute et expression orale.',reviewBody:'Fixe les mots avant la prochaine leçon.',speak:'Parler avec Twin',speakBody:'Transforme ton apprentissage en conversation.',start:'Commencer',better:'Chaque jour, un pas vers un meilleur anglais'},
  German:{weekly:'Dein Wochenziel',weeklyBody:'5 Lektionen abschließen',continue:'Lektion fortsetzen',next:'Baue Sicherheit mit praktischem Alltagsenglisch auf.',foundation:'Lerne erste nützliche Wörter mit Bildern, Hören und Sprechen.',reviewBody:'Festige fällige Wörter vor der nächsten Lektion.',speak:'Mit Twin sprechen',speakBody:'Mach aus dem Gelernten ein echtes Gespräch.',start:'Jetzt starten',better:'Jeden Tag ein Schritt zu besserem Englisch'},
  Spanish:{weekly:'Tu meta esta semana',weeklyBody:'Completa 5 lecciones',continue:'Continuar lección',next:'Gana confianza con inglés práctico para la vida diaria.',foundation:'Aprende tus primeras palabras útiles con imágenes, escucha y habla.',reviewBody:'Fija las palabras antes de la siguiente lección.',speak:'Habla con Twin',speakBody:'Convierte lo aprendido en conversación real.',start:'Empezar',better:'Cada día, un paso más hacia un mejor inglés'},
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
  const weeklyCompleted = useMemo(() => Object.values(progress).filter(item => item.completed && isThisWeek(item.completedAt)).length, [progress]);
  const weeklyGoal = 5;
  const weeklyPercent = Math.min(100, Math.round((weeklyCompleted / weeklyGoal) * 100));

  const recommendation: Recommendation = useMemo(() => {
    if (!profile?.beginnerFoundationCompleted) return { kind:'foundation', eyebrow:'A0 → A1', title:t(language,'firstWords'), body:ui.foundation, action:t(language,'startFirstWords'), to:'/start', minutes:5 };
    if (dueCount) return { kind:'review', eyebrow:'FSRS', title:t(language,'smartReview'), body:ui.reviewBody, action:t(language,'reviewNow'), to:'/review', minutes:3 };
    if (nextLesson) return { kind:'lesson', eyebrow:nextLesson.id.startsWith('a2-')?'A2 · Lesson':'A1 · Lesson', title:nextLesson.title, body:ui.next, action:ui.start, to:`/lesson/${nextLesson.id}`, minutes:nextLesson.minutes };
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
  const planItems = !profile.beginnerFoundationCompleted ? [{id:'foundation',minutes:5,lessonId:undefined}] : dailyPlan.slice(0,3);

  return <div className="app-shell reference-home exact-reference-home" dir={dir}><div className="phone"><main className="page">
    <header className="exact-brand-row">
      <div className="exact-brand-mark" aria-hidden="true"><BookOpen /></div>
      <div className="exact-brand-copy"><strong>English <b>Twin</b></strong><small>Your Personal English Coach</small></div>
      <button className="exact-header-avatar" onClick={() => nav('/profile')} aria-label="Profile">{name.slice(0,1).toUpperCase()}</button>
    </header>

    <section className="exact-user-row">
      <button className="exact-user-picture" onClick={() => nav('/profile')} aria-label="Profile"><img src="/tutor-avatar.svg" alt=""/><span><Target /></span></button>
      <div><small>{t(language,'greeting')}</small><h1>{name}</h1><p>{ui.better}</p></div>
    </section>

    <section className="exact-week-card">
      <span className="exact-goal-icon"><Target /></span>
      <div className="exact-week-copy"><b>{ui.weekly}</b><p>{ui.weeklyBody}</p></div>
      <strong>{weeklyCompleted} / {weeklyGoal}</strong>
      <div className="exact-week-progress"><i style={{width:`${weeklyPercent}%`}} /></div>
    </section>

    <section className={`exact-feature-card exact-${recommendation.kind}`}>
      <div className="exact-feature-copy">
        <span>{ui.continue}</span>
        <small>{recommendation.eyebrow}</small>
        <h2>{recommendation.title}</h2>
        <p>{recommendation.body}</p>
        <div className="exact-feature-meta"><em>{recommendation.eyebrow}</em><em>{recommendation.minutes} min</em></div>
      </div>
      <img className="exact-tutor-art" src="/tutor-avatar.svg" alt="" aria-hidden="true"/>
      <button className="exact-feature-action" onClick={() => nav(recommendation.to)}>{recommendation.action}<ChevronRight /></button>
    </section>

    <section className="exact-today">
      <div className="exact-section-title"><h3>{t(language,'todayPlan')}</h3><button onClick={() => nav('/learn')}>{t(language,'seeAll')}</button></div>
      <div className="exact-plan-list">
        {planItems.map((item:any,index) => {
          const Icon = index === 0 ? BookOpen : index === 1 ? Mic2 : RotateCcw;
          const label = item.id === 'foundation' ? t(language,'startFirstWords') : item.id === 'review' ? t(language,'vocabularyReview') : item.id === 'speaking' ? t(language,'speakWithTwin') : item.id === 'lesson' ? t(language,'nextLesson') : t(language,'smartReview');
          const route = item.id === 'foundation' ? '/start' : planRoute(item.id,item.lessonId);
          return <button key={`${item.id}-${index}`} onClick={() => nav(route)}>
            <span className={index === 0 && weeklyCompleted > 0 ? 'exact-plan-state done' : 'exact-plan-state'}>{index === 0 && weeklyCompleted > 0 ? <Check/> : <Icon/>}</span>
            <div><b>{label}</b><small>{item.minutes || 5} min</small></div>
            <ChevronRight />
          </button>;
        })}
      </div>
    </section>
  </main><AppDock language={language}/></div></div>;
}
