import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, Headphones, Volume2 } from 'lucide-react';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';

type WordCard = {
  id: string;
  emoji: string;
  word: string;
  phonetic: string;
  meanings: Record<SupportedLanguage, string>;
  example: string;
};

const words: WordCard[] = [
  { id: 'hello', emoji: '👋', word: 'hello', phonetic: 'heh-LOH', example: 'Hello!', meanings: { English: 'hello', Arabic: 'مرحبًا', Dutch: 'hallo', French: 'bonjour', German: 'hallo', Spanish: 'hola' } },
  { id: 'water', emoji: '💧', word: 'water', phonetic: 'WAW-ter', example: 'Water, please.', meanings: { English: 'water', Arabic: 'ماء', Dutch: 'water', French: 'eau', German: 'Wasser', Spanish: 'agua' } },
  { id: 'apple', emoji: '🍎', word: 'apple', phonetic: 'AP-uhl', example: 'An apple.', meanings: { English: 'apple', Arabic: 'تفاحة', Dutch: 'appel', French: 'pomme', German: 'Apfel', Spanish: 'manzana' } },
  { id: 'home', emoji: '🏠', word: 'home', phonetic: 'HOHM', example: 'I am home.', meanings: { English: 'home', Arabic: 'المنزل', Dutch: 'thuis', French: 'maison', German: 'Zuhause', Spanish: 'casa' } },
  { id: 'coffee', emoji: '☕', word: 'coffee', phonetic: 'KAW-fee', example: 'Coffee, please.', meanings: { English: 'coffee', Arabic: 'قهوة', Dutch: 'koffie', French: 'café', German: 'Kaffee', Spanish: 'café' } },
  { id: 'name', emoji: '🪪', word: 'name', phonetic: 'NAYM', example: 'My name is Amir.', meanings: { English: 'name', Arabic: 'اسم', Dutch: 'naam', French: 'nom', German: 'Name', Spanish: 'nombre' } },
];

const ui: Record<SupportedLanguage, Record<string, string>> = {
  English: { title: 'Your first English words', subtitle: 'See it. Hear it. Say it. Then use it.', listen: 'Listen', say: 'Say it aloud', meaning: 'Meaning', choose: 'Which picture matches this word?', next: 'Next', check: 'Check', correct: 'Correct', tryAgain: 'Try again', example: 'Tiny sentence', finish: 'Start my learning path', progress: 'First words', loading: 'Preparing your first lesson…' },
  Arabic: { title: 'أول كلماتك بالإنجليزية', subtitle: 'شاهدها، اسمعها، انطقها، ثم استعملها.', listen: 'اسمع النطق', say: 'قلها بصوت عالٍ', meaning: 'المعنى', choose: 'أي صورة تطابق هذه الكلمة؟', next: 'التالي', check: 'تحقق', correct: 'صحيح', tryAgain: 'حاول مرة أخرى', example: 'جملة صغيرة', finish: 'ابدأ مسار التعلم', progress: 'الكلمات الأولى', loading: 'نجهّز أول درس لك…' },
  Dutch: { title: 'Je eerste Engelse woorden', subtitle: 'Kijk. Luister. Zeg het. Gebruik het.', listen: 'Luister', say: 'Zeg het hardop', meaning: 'Betekenis', choose: 'Welke afbeelding hoort bij dit woord?', next: 'Volgende', check: 'Controleer', correct: 'Goed', tryAgain: 'Probeer opnieuw', example: 'Korte zin', finish: 'Start mijn leerpad', progress: 'Eerste woorden', loading: 'Je eerste les wordt klaargezet…' },
  French: { title: 'Tes premiers mots anglais', subtitle: 'Regarde. Écoute. Répète. Utilise.', listen: 'Écouter', say: 'Dis-le à voix haute', meaning: 'Sens', choose: 'Quelle image correspond à ce mot ?', next: 'Suivant', check: 'Vérifier', correct: 'Correct', tryAgain: 'Réessaie', example: 'Petite phrase', finish: 'Commencer mon parcours', progress: 'Premiers mots', loading: 'Préparation de ta première leçon…' },
  German: { title: 'Deine ersten englischen Wörter', subtitle: 'Sehen. Hören. Sagen. Anwenden.', listen: 'Anhören', say: 'Sag es laut', meaning: 'Bedeutung', choose: 'Welches Bild passt zu diesem Wort?', next: 'Weiter', check: 'Prüfen', correct: 'Richtig', tryAgain: 'Nochmal versuchen', example: 'Kurzer Satz', finish: 'Lernpfad starten', progress: 'Erste Wörter', loading: 'Deine erste Lektion wird vorbereitet…' },
  Spanish: { title: 'Tus primeras palabras en inglés', subtitle: 'Mira. Escucha. Repite. Usa.', listen: 'Escuchar', say: 'Dilo en voz alta', meaning: 'Significado', choose: '¿Qué imagen corresponde a esta palabra?', next: 'Siguiente', check: 'Comprobar', correct: 'Correcto', tryAgain: 'Inténtalo otra vez', example: 'Frase corta', finish: 'Empezar mi ruta', progress: 'Primeras palabras', loading: 'Preparando tu primera lección…' },
};

export default function BeginnerFoundation() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<'learn' | 'match'>('learn');
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const snap = await getDoc(doc(db, 'users', current.uid));
      const data = snap.exists() ? snap.data() : {};
      setLanguage(normalizeLanguage(data.explanationLanguage || data.nativeLanguage));
    } finally { setLoading(false); }
  }), []);

  const copy = ui[language];
  const current = words[index];
  const options = useMemo(() => {
    const others = words.filter(item => item.id !== current.id);
    return [current, others[(index + 1) % others.length], others[(index + 3) % others.length]];
  }, [current, index]);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  function nextWord() {
    setSelected(''); setFeedback(null); setStage('learn');
    setIndex(currentIndex => Math.min(currentIndex + 1, words.length - 1));
  }

  async function finishFoundation() {
    if (!user || saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        beginnerFoundationCompleted: true,
        beginnerFoundationCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      nav('/learn');
    } finally { setSaving(false); }
  }

  if (loading) return <main className="center"><p>{ui.Arabic.loading}</p></main>;
  if (!user) return <Navigate to="/welcome" replace />;

  const isLast = index === words.length - 1;
  const dir = directionFor(language);

  return <div className="beginner-shell" dir={dir}>
    <header className="beginner-topbar">
      <button className="back" onClick={() => nav('/')}><ArrowLeft /> {language === 'Arabic' ? 'الرئيسية' : 'Home'}</button>
      <span>{copy.progress} · {index + 1}/{words.length}</span>
    </header>

    <main className="beginner-main">
      <div className="beginner-heading"><span>A0 → A1</span><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
      <div className="beginner-progress"><i style={{ width: `${((index + (stage === 'match' ? 0.65 : 0.2)) / words.length) * 100}%` }} /></div>

      {stage === 'learn' ? <section className="word-stage">
        <div className="word-visual" aria-label={current.word}>{current.emoji}</div>
        <div className="word-copy">
          <span>{copy.meaning}</span>
          <h2 dir="ltr">{current.word}</h2>
          <strong>{current.meanings[language]}</strong>
          <small dir="ltr">/{current.phonetic}/</small>
        </div>
        <button className="listen-button" onClick={() => speak(current.word)}><Volume2 /> {copy.listen}</button>
        <div className="repeat-tip"><Headphones /><div><b>{copy.say}</b><span dir="ltr">{current.word}</span></div></div>
        <div className="tiny-example"><span>{copy.example}</span><button onClick={() => speak(current.example)} dir="ltr">🔊 {current.example}</button></div>
        <button className="primary beginner-action" onClick={() => setStage('match')}>{copy.next}</button>
      </section> : <section className="match-stage">
        <span className="match-kicker">{copy.choose}</span>
        <h2 dir="ltr">{current.word}</h2>
        <button className="mini-listen" onClick={() => speak(current.word)}><Volume2 /> {copy.listen}</button>
        <div className="picture-options">{options.map(option => <button key={option.id} className={selected === option.id ? 'selected' : ''} onClick={() => { setSelected(option.id); setFeedback(null); }}><span>{option.emoji}</span></button>)}</div>
        {feedback && <div className={`beginner-feedback ${feedback}`}><CheckCircle2 /> {feedback === 'ok' ? copy.correct : copy.tryAgain}</div>}
        {!feedback || feedback === 'bad' ? <button className="primary beginner-action" disabled={!selected} onClick={() => setFeedback(selected === current.id ? 'ok' : 'bad')}>{copy.check}</button> :
          <button className="primary beginner-action" disabled={saving} onClick={() => isLast ? void finishFoundation() : nextWord()}>{saving ? '…' : isLast ? copy.finish : copy.next}</button>}
      </section>}
    </main>
  </div>;
}
