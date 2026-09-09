import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertTriangle, ArrowLeft, CheckCircle2, Headphones, LoaderCircle, LockKeyhole, Volume2 } from 'lucide-react';
import { ETButton, LearningShell, StatusState } from './ui/LearningUI';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
import { foundationCategories, foundationVocabulary as words } from './foundationVocabulary';

const ui: Record<SupportedLanguage, Record<string, string>> = {
  English: { home:'Home', title: 'Your first English words', subtitle: 'Six useful words at a time. Your progress is saved automatically.', listen: 'Listen', say: 'Say it aloud', meaning: 'Meaning', choose: 'Which picture matches this word?', next: 'Next', check: 'Check', correct: 'Correct', tryAgain: 'Try again', example: 'Tiny sentence', finish: 'Start my learning path', progress: 'First words', loading: 'Preparing your first lesson…', pack: 'Pack', saved: 'Progress saved', packDone: 'Pack complete', continuePack: 'Continue to next pack', loadError: 'Couldn’t load your first-word progress', loadErrorBody: 'Your saved A0 progress was not changed. Check the connection and try again.', saveError: 'Your answer is correct, but the progress could not be saved. Try Next again.', retry: 'Try again' },
  Arabic: { home:'الرئيسية', title: 'أول كلماتك بالإنجليزية', subtitle: 'ست كلمات مفيدة في كل مرة، وتقدمك يُحفظ تلقائيًا.', listen: 'اسمع النطق', say: 'قلها بصوت عالٍ', meaning: 'المعنى', choose: 'أي صورة تطابق هذه الكلمة؟', next: 'التالي', check: 'تحقق', correct: 'صحيح', tryAgain: 'حاول مرة أخرى', example: 'جملة صغيرة', finish: 'ابدأ مسار التعلم', progress: 'الكلمات الأولى', loading: 'نجهّز أول درس لك…', pack: 'المجموعة', saved: 'تم حفظ التقدم', packDone: 'اكتملت المجموعة', continuePack: 'انتقل للمجموعة التالية', loadError: 'تعذّر تحميل تقدّم الكلمات الأولى', loadErrorBody: 'لم يتغيّر تقدّم A0 المحفوظ. تحقق من الاتصال وحاول مرة أخرى.', saveError: 'إجابتك صحيحة، لكن تعذّر حفظ التقدّم. اضغط التالي مرة أخرى.', retry: 'حاول مرة أخرى' },
  Dutch: { home:'Start', title: 'Je eerste Engelse woorden', subtitle: 'Zes nuttige woorden per keer. Je voortgang wordt automatisch opgeslagen.', listen: 'Luister', say: 'Zeg het hardop', meaning: 'Betekenis', choose: 'Welke afbeelding hoort bij dit woord?', next: 'Volgende', check: 'Controleer', correct: 'Goed', tryAgain: 'Probeer opnieuw', example: 'Korte zin', finish: 'Start mijn leerpad', progress: 'Eerste woorden', loading: 'Je eerste les wordt klaargezet…', pack: 'Pakket', saved: 'Voortgang opgeslagen', packDone: 'Pakket voltooid', continuePack: 'Volgend pakket', loadError: 'Je voortgang kon niet worden geladen', loadErrorBody: 'Je opgeslagen A0-voortgang is niet gewijzigd. Controleer de verbinding en probeer opnieuw.', saveError: 'Je antwoord is goed, maar de voortgang kon niet worden opgeslagen. Probeer Volgende opnieuw.', retry: 'Opnieuw proberen' },
  French: { home:'Accueil', title: 'Tes premiers mots anglais', subtitle: 'Six mots utiles à la fois. Ta progression est enregistrée automatiquement.', listen: 'Écouter', say: 'Dis-le à voix haute', meaning: 'Sens', choose: 'Quelle image correspond à ce mot ?', next: 'Suivant', check: 'Vérifier', correct: 'Correct', tryAgain: 'Réessaie', example: 'Petite phrase', finish: 'Commencer mon parcours', progress: 'Premiers mots', loading: 'Préparation de ta première leçon…', pack: 'Pack', saved: 'Progression enregistrée', packDone: 'Pack terminé', continuePack: 'Pack suivant', loadError: 'Impossible de charger ta progression A0', loadErrorBody: 'Ta progression enregistrée n’a pas été modifiée. Vérifie la connexion et réessaie.', saveError: 'Ta réponse est correcte, mais la progression n’a pas pu être enregistrée. Réessaie Suivant.', retry: 'Réessayer' },
  German: { home:'Start', title: 'Deine ersten englischen Wörter', subtitle: 'Sechs nützliche Wörter auf einmal. Dein Fortschritt wird automatisch gespeichert.', listen: 'Anhören', say: 'Sag es laut', meaning: 'Bedeutung', choose: 'Welches Bild passt zu diesem Wort?', next: 'Weiter', check: 'Prüfen', correct: 'Richtig', tryAgain: 'Nochmal versuchen', example: 'Kurzer Satz', finish: 'Lernpfad starten', progress: 'Erste Wörter', loading: 'Deine erste Lektion wird vorbereitet…', pack: 'Paket', saved: 'Fortschritt gespeichert', packDone: 'Paket abgeschlossen', continuePack: 'Nächstes Paket', loadError: 'Dein A0-Fortschritt konnte nicht geladen werden', loadErrorBody: 'Dein gespeicherter Fortschritt wurde nicht verändert. Prüfe die Verbindung und versuche es erneut.', saveError: 'Deine Antwort ist richtig, aber der Fortschritt konnte nicht gespeichert werden. Versuche Weiter erneut.', retry: 'Erneut versuchen' },
  Spanish: { home:'Inicio', title: 'Tus primeras palabras en inglés', subtitle: 'Seis palabras útiles cada vez. Tu progreso se guarda automáticamente.', listen: 'Escuchar', say: 'Dilo en voz alta', meaning: 'Significado', choose: '¿Qué imagen corresponde a esta palabra?', next: 'Siguiente', check: 'Comprobar', correct: 'Correcto', tryAgain: 'Inténtalo otra vez', example: 'Frase corta', finish: 'Empezar mi ruta', progress: 'Primeras palabras', loading: 'Preparando tu primera lección…', pack: 'Paquete', saved: 'Progreso guardado', packDone: 'Paquete completado', continuePack: 'Siguiente paquete', loadError: 'No se pudo cargar tu progreso A0', loadErrorBody: 'Tu progreso guardado no cambió. Revisa la conexión y vuelve a intentarlo.', saveError: 'Tu respuesta es correcta, pero no se pudo guardar el progreso. Pulsa Siguiente otra vez.', retry: 'Intentar de nuevo' },
};

const packs = foundationCategories.map(category => ({ category, words: words.filter(item => item.category === category) }));

export default function BeginnerFoundation() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [packIndex, setPackIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [completedWordIds, setCompletedWordIds] = useState<string[]>([]);
  const [stage, setStage] = useState<'learn' | 'match'>('learn');
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [packComplete, setPackComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setLoading(true);
      setLoadError(false);
      if (!current) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', current.uid));
        if (!active) return;
        const data = snap.exists() ? snap.data() : {};
        const nextLanguage = normalizeLanguage(data.explanationLanguage || data.nativeLanguage || data.interfaceLanguage || 'English');
        setLanguage(nextLanguage);
        const savedIds = Array.isArray(data.beginnerFoundationCompletedWordIds) ? data.beginnerFoundationCompletedWordIds.filter((id: unknown): id is string => typeof id === 'string') : [];
        if (data.beginnerFoundationCompleted === true || savedIds.length >= words.length) {
          nav('/learn', { replace: true });
          return;
        }
        setCompletedWordIds(savedIds);
        const savedPack = Number.isInteger(data.beginnerFoundationCurrentPack) ? Math.max(0, Math.min(packs.length - 1, data.beginnerFoundationCurrentPack)) : 0;
        setPackIndex(savedPack);
        const activePack = packs[savedPack];
        const firstIncomplete = activePack.words.findIndex(item => !savedIds.includes(item.id));
        setIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
        setPackComplete(firstIncomplete < 0 && savedIds.length < words.length);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [nav, reloadKey]);

  const copy = ui[language];
  const activePack = packs[packIndex];
  const current = activePack.words[index];
  const packCompletedCount = activePack.words.filter(item => completedWordIds.includes(item.id)).length;
  const totalCompleted = completedWordIds.length;
  const options = useMemo(() => {
    const others = words.filter(item => item.id !== current.id);
    const globalIndex = words.findIndex(item => item.id === current.id);
    return [current, others[(globalIndex + 7) % others.length], others[(globalIndex + 19) % others.length]];
  }, [current]);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  function resetWord(nextIndex: number) {
    setSelected('');
    setFeedback(null);
    setSaveError('');
    setStage('learn');
    setIndex(nextIndex);
  }

  async function saveWordAndAdvance() {
    const currentUser = user;
    if (!currentUser || saving) return;
    const nextIds = completedWordIds.includes(current.id) ? completedWordIds : [...completedWordIds, current.id];
    const isPackLastWord = activePack.words.every(item => nextIds.includes(item.id));
    const isFoundationDone = nextIds.length === words.length;
    setSaving(true);
    setSaveError('');
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        beginnerFoundationCompletedWordIds: nextIds,
        beginnerFoundationCurrentPack: isPackLastWord && !isFoundationDone ? Math.min(packIndex + 1, packs.length - 1) : packIndex,
        beginnerFoundationWordCount: nextIds.length,
        beginnerFoundationLastWordId: current.id,
        ...(isFoundationDone ? { beginnerFoundationCompleted: true, beginnerFoundationCompletedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setCompletedWordIds(nextIds);
      if (isFoundationDone) {
        nav('/learn', { replace: true });
        return;
      }
      if (isPackLastWord) {
        setPackComplete(true);
        return;
      }
      const nextIndex = activePack.words.findIndex((item, candidateIndex) => candidateIndex > index && !nextIds.includes(item.id));
      resetWord(nextIndex >= 0 ? nextIndex : Math.min(index + 1, activePack.words.length - 1));
    } catch {
      setSaveError(copy.saveError);
    } finally {
      setSaving(false);
    }
  }

  function continueNextPack() {
    const nextPack = Math.min(packIndex + 1, packs.length - 1);
    setPackIndex(nextPack);
    setPackComplete(false);
    setSaveError('');
    const firstIncomplete = packs[nextPack].words.findIndex(item => !completedWordIds.includes(item.id));
    resetWord(firstIncomplete >= 0 ? firstIncomplete : 0);
  }

  function choosePack(nextPack: number) {
    const previousComplete = nextPack === 0 || packs[nextPack - 1].words.every(item => completedWordIds.includes(item.id));
    if (!previousComplete) return;
    setPackIndex(nextPack);
    setPackComplete(packs[nextPack].words.every(item => completedWordIds.includes(item.id)) && completedWordIds.length < words.length);
    setSaveError('');
    const firstIncomplete = packs[nextPack].words.findIndex(item => !completedWordIds.includes(item.id));
    resetWord(firstIncomplete >= 0 ? firstIncomplete : 0);
  }

  const dir = directionFor(language);
  if (loading) return <LearningShell language={language} dir={dir} showDock={false} pageClassName="foundation-status-page"><StatusState icon={<LoaderCircle />} eyebrow="A0 FOUNDATION" title={copy.loading} /></LearningShell>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (loadError) return <LearningShell language={language} dir={dir} showDock={false} pageClassName="foundation-status-page"><StatusState icon={<AlertTriangle />} tone="danger" eyebrow="A0 FOUNDATION" title={copy.loadError} body={copy.loadErrorBody} action={<ETButton onClick={() => setReloadKey(value => value + 1)}>{copy.retry}</ETButton>} /></LearningShell>;

  const totalPercent = Math.round((totalCompleted / words.length) * 100);

  return <div className="beginner-shell" dir={dir}>
    <header className="beginner-topbar">
      <button type="button" className="back" onClick={() => nav('/')}><ArrowLeft /> {copy.home}</button>
      <span>{copy.progress} · {totalCompleted}/{words.length}</span>
    </header>

    <main className="beginner-main" aria-busy={saving}>
      <div className="beginner-heading"><span>A0 → A1 · {copy.pack} {packIndex + 1}/{packs.length}</span><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
      <div className="foundation-pack-strip" aria-label="Foundation packs">{packs.map((pack, packNo) => {
        const done = pack.words.every(item => completedWordIds.includes(item.id));
        const unlocked = packNo === 0 || packs[packNo - 1].words.every(item => completedWordIds.includes(item.id));
        return <button type="button" key={pack.category} disabled={!unlocked} aria-current={packNo === packIndex ? 'step' : undefined} className={`${packNo === packIndex ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => choosePack(packNo)}><span>{done ? '✓' : unlocked ? packNo + 1 : <LockKeyhole />}</span><small>{pack.category}</small></button>;
      })}</div>
      <div className="beginner-progress" role="progressbar" aria-label={copy.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={totalPercent}><i style={{ width: `${totalPercent}%` }} /></div>
      <div className="foundation-pack-meta"><span>{activePack.category}</span><b>{packCompletedCount}/{activePack.words.length}</b><small>{totalPercent}% · {copy.saved}</small></div>

      {packComplete ? <section className="word-stage pack-complete-card"><CheckCircle2 /><span className="eyebrow">{activePack.category.toUpperCase()}</span><h2>{copy.packDone}</h2><p>{packCompletedCount} / {activePack.words.length}</p><button type="button" className="primary beginner-action" onClick={continueNextPack}>{copy.continuePack}</button></section> : stage === 'learn' ? <section className="word-stage">
        <div className="word-visual" aria-label={current.word}>{current.emoji}</div>
        <div className="word-copy">
          <span>{copy.meaning}</span>
          <h2 dir="ltr">{current.word}</h2>
          <strong>{current.meanings[language]}</strong>
          <small dir="ltr">/{current.phonetic}/</small>
        </div>
        <button type="button" className="listen-button" onClick={() => speak(current.word)}><Volume2 /> {copy.listen}</button>
        <div className="repeat-tip"><Headphones /><div><b>{copy.say}</b><span dir="ltr">{current.word}</span></div></div>
        <div className="tiny-example"><span>{copy.example}</span><button type="button" onClick={() => speak(current.example)} dir="ltr">🔊 {current.example}</button></div>
        <button type="button" className="primary beginner-action" onClick={() => { setStage('match'); setSaveError(''); }}>{copy.next}</button>
      </section> : <section className="match-stage">
        <span className="match-kicker">{copy.choose}</span>
        <h2 dir="ltr">{current.word}</h2>
        <button type="button" className="mini-listen" onClick={() => speak(current.word)}><Volume2 /> {copy.listen}</button>
        <div className="picture-options">{options.map((option, optionIndex) => <button type="button" key={option.id} aria-label={`Picture option ${optionIndex + 1}`} aria-pressed={selected === option.id} className={selected === option.id ? 'selected' : ''} onClick={() => { setSelected(option.id); setFeedback(null); setSaveError(''); }}><span aria-hidden="true">{option.emoji}</span></button>)}</div>
        {feedback && <div className={`beginner-feedback ${feedback}`} role="status"><CheckCircle2 /> {feedback === 'ok' ? copy.correct : copy.tryAgain}</div>}
        {saveError ? <p className="error" role="alert">{saveError}</p> : null}
        {!feedback || feedback === 'bad' ? <button type="button" className="primary beginner-action" disabled={!selected} onClick={() => setFeedback(selected === current.id ? 'ok' : 'bad')}>{copy.check}</button> :
          <button type="button" className="primary beginner-action" disabled={saving} aria-busy={saving} onClick={() => void saveWordAndAdvance()}>{saving ? '…' : copy.next}</button>}
      </section>}
    </main>
  </div>;
}
