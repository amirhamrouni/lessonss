import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AlertTriangle, Check, ChevronRight, LoaderCircle, LockKeyhole, Star } from 'lucide-react';
import { ETButton, LearningShell, PageTitle, ProgressBar, StatusState, Surface } from './ui/LearningUI';
import { auth, db } from './firebase';
import { lessonsForLevel, lessonsForUnit, units } from './curriculumAll';
import { loadLessonProgress, ProgressMap, summarizeProgress } from './learning';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';

type Profile = { nativeLanguage?: string; explanationLanguage?: string; interfaceLanguage?: string; placementLevel?: string; cefrLevel?: string };
type ActiveLevel = 'A1' | 'A2';

const stateCopy: Record<SupportedLanguage, { loading:string; loadError:string; loadErrorBody:string; retry:string }> = {
  English:{loading:'Loading your learning path…',loadError:'Couldn’t load your learning path',loadErrorBody:'Your saved lesson progress is still safe. Check the connection and try again.',retry:'Try again'},
  Arabic:{loading:'نحمّل مسار تعلّمك…',loadError:'تعذّر تحميل مسار التعلّم',loadErrorBody:'تقدّم دروسك المحفوظ مازال آمنًا. تحقق من الاتصال وحاول مرة أخرى.',retry:'حاول مرة أخرى'},
  Dutch:{loading:'Je leerpad wordt geladen…',loadError:'Je leerpad kon niet worden geladen',loadErrorBody:'Je opgeslagen lesvoortgang is veilig. Controleer je verbinding en probeer opnieuw.',retry:'Opnieuw proberen'},
  French:{loading:'Chargement de ton parcours…',loadError:'Impossible de charger ton parcours',loadErrorBody:'Ta progression enregistrée est intacte. Vérifie la connexion et réessaie.',retry:'Réessayer'},
  German:{loading:'Dein Lernpfad wird geladen…',loadError:'Dein Lernpfad konnte nicht geladen werden',loadErrorBody:'Dein gespeicherter Fortschritt ist sicher. Prüfe die Verbindung und versuche es erneut.',retry:'Erneut versuchen'},
  Spanish:{loading:'Cargando tu ruta de aprendizaje…',loadError:'No se pudo cargar tu ruta',loadErrorBody:'Tu progreso guardado sigue seguro. Revisa la conexión y vuelve a intentarlo.',retry:'Intentar de nuevo'},
};

export default function ReferenceLearnJourney() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [level, setLevel] = useState<ActiveLevel>('A1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async current => {
      setUser(current);
      setLoadError(false);
      setLoading(true);
      if (!current) { setLoading(false); return; }
      try {
        const [profileSnap, learnerProgress] = await Promise.all([
          getDoc(doc(db, 'users', current.uid)),
          loadLessonProgress(current.uid),
        ]);
        const nextProfile = profileSnap.exists() ? profileSnap.data() as Profile : {};
        setProfile(nextProfile);
        setProgress(learnerProgress);
        const measuredLevel = nextProfile.placementLevel || nextProfile.cefrLevel || 'A1';
        if (String(measuredLevel).toUpperCase().startsWith('A2')) setLevel('A2');
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [reloadKey]);

  const language = normalizeLanguage(profile.explanationLanguage || profile.nativeLanguage || profile.interfaceLanguage || 'English');
  const dir = directionFor(language);
  const ar = language === 'Arabic';
  const state = stateCopy[language];
  const levelLessons = useMemo(() => lessonsForLevel(level), [level]);
  const summary = useMemo(() => summarizeProgress(progress, levelLessons.length), [progress, levelLessons]);
  const levelUnits = useMemo(() => units.filter(unit => level === 'A2' ? unit.id.startsWith('a2-') : !unit.id.startsWith('a2-')), [level]);

  function lessonUnlocked(lessonId: string) {
    const globalIndex = levelLessons.findIndex(lesson => lesson.id === lessonId);
    if (globalIndex < 0) return false;
    if (progress[lessonId]?.completed || globalIndex === 0) return true;
    const previous = levelLessons[globalIndex - 1];
    return Boolean(previous && progress[previous.id]?.completed);
  }

  if (loading) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<LoaderCircle />} eyebrow="ENGLISH TWIN" title={state.loading} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace/>;
  if (loadError) return <LearningShell language={language} dir={dir} showDock={false}><StatusState icon={<AlertTriangle />} tone="danger" title={state.loadError} body={state.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{state.retry}</ETButton>} /></LearningShell>;

  return (
    <LearningShell language={language} dir={dir} className="et-learn-shell">
      <PageTitle title={ar ? 'تعلّم' : 'Learn'} description={ar ? 'مسار واضح من الأساسيات إلى المحادثة.' : 'A clear path from foundations to real conversation.'} />

      <div className="et-cefr-tabs" role="tablist" aria-label="CEFR level">
        <button type="button" onClick={() => nav('/start')}>A0</button>
        <button type="button" className={level === 'A1' ? 'active' : ''} onClick={() => setLevel('A1')} aria-selected={level === 'A1'} role="tab">A1</button>
        <button type="button" className={level === 'A2' ? 'active' : ''} onClick={() => setLevel('A2')} aria-selected={level === 'A2'} role="tab">A2</button>
        <button type="button" disabled aria-disabled="true">B1</button>
        <button type="button" disabled aria-disabled="true">B2</button>
      </div>

      <Surface className="et-level-summary">
        <div className="et-level-summary-head">
          <div><span>{level}</span><h2>{ar ? (level === 'A1' ? 'الأساسيات' : 'الاستقلال اليومي') : (level === 'A1' ? 'Foundations' : 'Real-world independence')}</h2></div>
          <strong>{summary.percent}%</strong>
        </div>
        <ProgressBar value={summary.percent} />
        <small>{ar ? `أكملت ${summary.completed} من ${summary.total} درسًا` : `${summary.completed} of ${summary.total} lessons completed`}</small>
      </Surface>

      <div className="et-learning-path">
        {levelUnits.map((unit, unitIndex) => {
          const unitLessons = lessonsForUnit(unit.id);
          const completeCount = unitLessons.filter(lesson => progress[lesson.id]?.completed).length;
          const firstOpen = unitLessons.find(lesson => !progress[lesson.id]?.completed && lessonUnlocked(lesson.id));
          const unitComplete = unitLessons.length > 0 && completeCount === unitLessons.length;
          return (
            <section className="et-unit" key={unit.id}>
              <div className="et-unit-rail" aria-hidden="true"><span>{unitIndex + 1}</span><i /></div>
              <div className="et-unit-content">
                <div className="et-unit-title">
                  <small>{level} · {ar ? 'الوحدة' : 'UNIT'} {String(unitIndex + 1).padStart(2,'0')}</small>
                  <h2>{unit.title.replace(/^A2 · /,'')}</h2>
                  <p>{ar ? `${completeCount} من ${unitLessons.length} دروس مكتملة` : `${completeCount} of ${unitLessons.length} lessons complete`}</p>
                </div>

                <Surface className="et-lesson-list">
                  {unitLessons.map((lesson, lessonIndex) => {
                    const result = progress[lesson.id];
                    const complete = Boolean(result?.completed);
                    const unlocked = lessonUnlocked(lesson.id);
                    return (
                      <button
                        type="button"
                        key={lesson.id}
                        className={`et-lesson-row ${complete ? 'complete' : unlocked ? 'current' : 'locked'}`}
                        onClick={() => unlocked && nav(`/lesson/${lesson.id}`)}
                        disabled={!unlocked}
                        aria-label={`${lesson.title}. ${complete ? 'Completed' : unlocked ? 'Available' : 'Locked'}.`}
                      >
                        <span className="et-lesson-node">{complete ? <Check/> : unlocked ? lessonIndex + 1 : <LockKeyhole/>}</span>
                        <div><b>{lesson.title}</b><small>{lesson.skill} · {lesson.minutes} min</small></div>
                        <span className="et-lesson-status">{complete ? `${result?.score ?? 100}%` : unlocked ? (ar ? 'ابدأ' : 'Start') : ''}{unlocked && !complete ? <ChevronRight/> : null}</span>
                      </button>
                    );
                  })}
                </Surface>

                <div className="et-unit-reward">
                  <Star/>
                  <div><b>{ar ? `تقدّم في ${level}` : `${level} progress`}</b><small>{unitComplete ? (ar ? 'اكتملت هذه الوحدة.' : 'This unit is complete.') : (ar ? 'كل درس يفتح الخطوة التالية.' : 'Each lesson unlocks the next step.')}</small></div>
                  <ETButton variant="ghost" disabled={!firstOpen} aria-label={firstOpen ? `Open ${firstOpen.title}` : 'No available lesson'} onClick={() => firstOpen && nav(`/lesson/${firstOpen.id}`)}>{unitComplete ? <Check/> : <ChevronRight />}</ETButton>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </LearningShell>
  );
}
