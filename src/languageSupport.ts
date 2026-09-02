export type SupportedLanguage = 'English' | 'Arabic' | 'Dutch' | 'French' | 'German' | 'Spanish';

export type SkillLevels = {
  speaking: string;
  listening: string;
  reading: string;
  writing: string;
  grammar: string;
  vocabulary: string;
};

export const supportedLanguages: Array<{ value: SupportedLanguage; label: string; nativeLabel: string; dir: 'ltr' | 'rtl' }> = [
  { value: 'Arabic', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { value: 'Dutch', label: 'Dutch', nativeLabel: 'Nederlands', dir: 'ltr' },
  { value: 'French', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  { value: 'German', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  { value: 'Spanish', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  { value: 'English', label: 'English', nativeLabel: 'English', dir: 'ltr' },
];

export const defaultSkillLevels = (level = 'A1'): SkillLevels => ({
  speaking: level,
  listening: level,
  reading: level,
  writing: level,
  grammar: level,
  vocabulary: level,
});

const copy: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    learn: 'Learn', choose: 'Choose the best answer', fill: 'Complete the English sentence', check: 'Check answer', continue: 'Continue', correct: 'Correct', retry: 'Not quite', explanation: 'Why?', support: 'Explanation language', target: 'Answer in English', hint: 'Hint', nativeQuestion: 'Read the task and answer in English.',
    loadingState: 'Reading your learning state…', greeting: 'Good morning,', amazing: "Let's make today amazing!", dailyGoal: 'Daily goal', greatProgress: 'Great progress!', continueLearning: 'Continue learning', todayPlan: "Today's plan", seeAll: 'See all', firstWords: 'First words', startFirstWords: 'Start first words', reviewNow: 'Review now', vocabularyReview: 'Vocabulary Review', speakWithTwin: 'Speak with Twin', nextLesson: 'Next lesson', smartReview: 'Smart Review', keepGoing: 'Keep it going!', keepGoingBody: 'Every small step builds stronger English.', practice: 'Practice',
    practiceEyebrow: 'TRAIN, TEST, RETAIN', practiceIntro: 'Different engines for different learning jobs.', recommended: 'RECOMMENDED', memory: 'MEMORY', output: 'OUTPUT', diagnostic: 'DIAGNOSTIC', voice: 'VOICE', smartReviewDescription: 'FSRS vocabulary review with Again / Hard / Good / Easy scheduling.', sentenceBuilder: 'Sentence Builder', sentenceBuilderDescription: 'Build correct English from shuffled words instead of only tapping answers.', placementTest: 'Placement Test', conversationLab: 'Conversation Lab', conversationDescription: 'Move from structured practice into spontaneous speech with your Twin.', nothingDue: 'Nothing due', reviewDueSuffix: 'reviews are due now.', buildRecall: 'Build recall before it fades.', completeLessonFirst: 'Complete a lesson, then train recall.', fsrsCompletedOnly: 'FSRS schedules vocabulary from lessons you actually completed.',
  },
  Arabic: {
    learn: 'تعلّم', choose: 'اختر الإجابة الإنجليزية الأنسب', fill: 'أكمل الجملة الإنجليزية', check: 'تحقق من الإجابة', continue: 'متابعة', correct: 'إجابة صحيحة', retry: 'ليست الإجابة الصحيحة بعد', explanation: 'لماذا؟', support: 'لغة الشرح', target: 'أجب بالإنجليزية', hint: 'تلميح', nativeQuestion: 'اقرأ المطلوب ثم أجب بالإنجليزية.',
    loadingState: 'نقرأ حالة تعلّمك…', greeting: 'مرحبًا', amazing: 'خلّينا نخلي اليوم رائعًا!', dailyGoal: 'هدف اليوم', greatProgress: 'تقدم ممتاز!', continueLearning: 'تابع التعلّم', todayPlan: 'خطة اليوم', seeAll: 'عرض الكل', firstWords: 'كلماتك الأولى', startFirstWords: 'ابدأ الكلمات الأولى', reviewNow: 'راجع الآن', vocabularyReview: 'مراجعة المفردات', speakWithTwin: 'تحدث مع Twin', nextLesson: 'الدرس التالي', smartReview: 'المراجعة الذكية', keepGoing: 'استمر!', keepGoingBody: 'كل خطوة صغيرة تبني إنجليزية أقوى.', practice: 'تدرّب',
    practiceEyebrow: 'تدرّب · اختبر · ثبّت', practiceIntro: 'كل وضع تدريب له وظيفة مختلفة في تعلّم الإنجليزية.', recommended: 'المقترح الآن', memory: 'الذاكرة', output: 'الإنتاج', diagnostic: 'تشخيص المستوى', voice: 'الصوت', smartReviewDescription: 'مراجعة مفردات بنظام FSRS وفق أداءك الحقيقي.', sentenceBuilder: 'بناء الجملة', sentenceBuilderDescription: 'رتّب الكلمات لتبني جملة إنجليزية صحيحة بدل الاكتفاء بالتعرّف على الإجابة.', placementTest: 'اختبار تحديد المستوى', conversationLab: 'مختبر المحادثة', conversationDescription: 'انتقل من التمارين المنظمة إلى الكلام العفوي مع الـTwin.', nothingDue: 'لا توجد مراجعة الآن', reviewDueSuffix: 'مراجعات مستحقة الآن.', buildRecall: 'ثبّت ما تعلمته قبل أن يضعف التذكّر.', completeLessonFirst: 'أكمل درسًا أولًا، ثم ابدأ تدريب الذاكرة.', fsrsCompletedOnly: 'يجدول FSRS كلمات الدروس التي أكملتها فعليًا فقط.',
  },
  Dutch: {
    learn: 'Leren', choose: 'Kies het beste Engelse antwoord', fill: 'Vul de Engelse zin aan', check: 'Controleer antwoord', continue: 'Doorgaan', correct: 'Goed', retry: 'Nog niet helemaal', explanation: 'Waarom?', support: 'Uitlegtaal', target: 'Antwoord in het Engels', hint: 'Hint', nativeQuestion: 'Lees de opdracht en antwoord in het Engels.',
    loadingState: 'Je leerstatus wordt geladen…', greeting: 'Goedemorgen,', amazing: 'Maak er vandaag iets moois van!', dailyGoal: 'Dagdoel', greatProgress: 'Goed bezig!', continueLearning: 'Ga verder met leren', todayPlan: 'Plan voor vandaag', seeAll: 'Alles bekijken', firstWords: 'Je eerste woorden', startFirstWords: 'Start met eerste woorden', reviewNow: 'Nu herhalen', vocabularyReview: 'Woordenschat herhalen', speakWithTwin: 'Praat met Twin', nextLesson: 'Volgende les', smartReview: 'Slim herhalen', keepGoing: 'Ga zo door!', keepGoingBody: 'Elke kleine stap maakt je Engels sterker.', practice: 'Oefenen',
    practiceEyebrow: 'OEFEN · TEST · ONTHOUD', practiceIntro: 'Elke oefenmodus heeft een eigen leerdoel.', recommended: 'AANBEVOLEN', memory: 'GEHEUGEN', output: 'PRODUCTIE', diagnostic: 'NIVEAUTEST', voice: 'SPREKEN', smartReviewDescription: 'FSRS-woordenschat herhalen op basis van je echte prestaties.', sentenceBuilder: 'Zinnen bouwen', sentenceBuilderDescription: 'Bouw correcte Engelse zinnen uit losse woorden in plaats van alleen antwoorden te herkennen.', placementTest: 'Niveautest', conversationLab: 'Gesprekslab', conversationDescription: 'Ga van gestructureerde oefeningen naar spontaan spreken met je Twin.', nothingDue: 'Niets te herhalen', reviewDueSuffix: 'herhalingen zijn nu aan de beurt.', buildRecall: 'Versterk je geheugen voordat kennis vervaagt.', completeLessonFirst: 'Voltooi eerst een les en train daarna je geheugen.', fsrsCompletedOnly: 'FSRS plant alleen woorden uit lessen die je echt hebt voltooid.',
  },
  French: {
    learn: 'Apprendre', choose: 'Choisis la meilleure réponse en anglais', fill: 'Complète la phrase anglaise', check: 'Vérifier', continue: 'Continuer', correct: 'Correct', retry: 'Pas encore', explanation: 'Pourquoi ?', support: "Langue d'explication", target: 'Réponds en anglais', hint: 'Indice', nativeQuestion: 'Lis la consigne puis réponds en anglais.',
    loadingState: 'Chargement de ton parcours…', greeting: 'Bonjour,', amazing: 'Faisons de cette journée une réussite !', dailyGoal: 'Objectif du jour', greatProgress: 'Très bon progrès !', continueLearning: 'Continuer à apprendre', todayPlan: "Programme d'aujourd'hui", seeAll: 'Tout voir', firstWords: 'Tes premiers mots', startFirstWords: 'Commencer les premiers mots', reviewNow: 'Réviser maintenant', vocabularyReview: 'Révision du vocabulaire', speakWithTwin: 'Parler avec Twin', nextLesson: 'Leçon suivante', smartReview: 'Révision intelligente', keepGoing: 'Continue comme ça !', keepGoingBody: "Chaque petit pas renforce ton anglais.", practice: 'Pratiquer',
    practiceEyebrow: 'ENTRAÎNE · TESTE · RETIENS', practiceIntro: "Chaque mode d'entraînement a un rôle précis.", recommended: 'RECOMMANDÉ', memory: 'MÉMOIRE', output: 'PRODUCTION', diagnostic: 'DIAGNOSTIC', voice: 'ORAL', smartReviewDescription: 'Révision du vocabulaire avec FSRS selon tes performances réelles.', sentenceBuilder: 'Construction de phrases', sentenceBuilderDescription: 'Construis des phrases anglaises correctes avec des mots mélangés au lieu de seulement reconnaître les réponses.', placementTest: 'Test de niveau', conversationLab: 'Laboratoire de conversation', conversationDescription: 'Passe des exercices structurés à une conversation spontanée avec ton Twin.', nothingDue: 'Aucune révision due', reviewDueSuffix: 'révisions sont dues maintenant.', buildRecall: 'Renforce ta mémoire avant que les acquis ne s’effacent.', completeLessonFirst: 'Termine d’abord une leçon, puis entraîne ta mémoire.', fsrsCompletedOnly: 'FSRS programme uniquement le vocabulaire des leçons réellement terminées.',
  },
  German: {
    learn: 'Lernen', choose: 'Wähle die beste englische Antwort', fill: 'Vervollständige den englischen Satz', check: 'Antwort prüfen', continue: 'Weiter', correct: 'Richtig', retry: 'Noch nicht ganz', explanation: 'Warum?', support: 'Erklärungssprache', target: 'Antworte auf Englisch', hint: 'Hinweis', nativeQuestion: 'Lies die Aufgabe und antworte auf Englisch.',
    loadingState: 'Dein Lernstand wird geladen…', greeting: 'Guten Morgen,', amazing: 'Machen wir heute etwas Großartiges!', dailyGoal: 'Tagesziel', greatProgress: 'Starker Fortschritt!', continueLearning: 'Weiterlernen', todayPlan: 'Heutiger Plan', seeAll: 'Alle ansehen', firstWords: 'Deine ersten Wörter', startFirstWords: 'Erste Wörter starten', reviewNow: 'Jetzt wiederholen', vocabularyReview: 'Wortschatz wiederholen', speakWithTwin: 'Mit Twin sprechen', nextLesson: 'Nächste Lektion', smartReview: 'Intelligente Wiederholung', keepGoing: 'Weiter so!', keepGoingBody: 'Jeder kleine Schritt macht dein Englisch stärker.', practice: 'Üben',
    practiceEyebrow: 'ÜBEN · TESTEN · BEHALTEN', practiceIntro: 'Jeder Übungsmodus erfüllt eine andere Lernaufgabe.', recommended: 'EMPFOHLEN', memory: 'GEDÄCHTNIS', output: 'AUSGABE', diagnostic: 'DIAGNOSE', voice: 'SPRECHEN', smartReviewDescription: 'FSRS-Wortschatztraining auf Basis deiner tatsächlichen Leistung.', sentenceBuilder: 'Satzbau', sentenceBuilderDescription: 'Bilde korrekte englische Sätze aus gemischten Wörtern, statt Antworten nur zu erkennen.', placementTest: 'Einstufungstest', conversationLab: 'Konversationslabor', conversationDescription: 'Wechsle von strukturierten Übungen zum spontanen Sprechen mit deinem Twin.', nothingDue: 'Keine Wiederholung fällig', reviewDueSuffix: 'Wiederholungen sind jetzt fällig.', buildRecall: 'Festige dein Wissen, bevor es verblasst.', completeLessonFirst: 'Schließe zuerst eine Lektion ab und trainiere dann dein Gedächtnis.', fsrsCompletedOnly: 'FSRS plant nur Wortschatz aus Lektionen, die du tatsächlich abgeschlossen hast.',
  },
  Spanish: {
    learn: 'Aprender', choose: 'Elige la mejor respuesta en inglés', fill: 'Completa la frase en inglés', check: 'Comprobar', continue: 'Continuar', correct: 'Correcto', retry: 'Todavía no', explanation: '¿Por qué?', support: 'Idioma de explicación', target: 'Responde en inglés', hint: 'Pista', nativeQuestion: 'Lee la tarea y responde en inglés.',
    loadingState: 'Cargando tu estado de aprendizaje…', greeting: 'Buenos días,', amazing: '¡Hagamos que hoy sea genial!', dailyGoal: 'Objetivo diario', greatProgress: '¡Gran progreso!', continueLearning: 'Seguir aprendiendo', todayPlan: 'Plan de hoy', seeAll: 'Ver todo', firstWords: 'Tus primeras palabras', startFirstWords: 'Empezar primeras palabras', reviewNow: 'Repasar ahora', vocabularyReview: 'Repaso de vocabulario', speakWithTwin: 'Hablar con Twin', nextLesson: 'Siguiente lección', smartReview: 'Repaso inteligente', keepGoing: '¡Sigue así!', keepGoingBody: 'Cada pequeño paso fortalece tu inglés.', practice: 'Practicar',
    practiceEyebrow: 'PRACTICA · PRUEBA · RETÉN', practiceIntro: 'Cada modo de práctica cumple una función distinta.', recommended: 'RECOMENDADO', memory: 'MEMORIA', output: 'PRODUCCIÓN', diagnostic: 'DIAGNÓSTICO', voice: 'VOZ', smartReviewDescription: 'Repaso de vocabulario con FSRS según tu rendimiento real.', sentenceBuilder: 'Constructor de frases', sentenceBuilderDescription: 'Construye frases correctas en inglés con palabras mezcladas en lugar de limitarte a reconocer respuestas.', placementTest: 'Prueba de nivel', conversationLab: 'Laboratorio de conversación', conversationDescription: 'Pasa de ejercicios estructurados a hablar de forma espontánea con tu Twin.', nothingDue: 'Nada pendiente', reviewDueSuffix: 'repasos están pendientes ahora.', buildRecall: 'Refuerza lo aprendido antes de que se debilite el recuerdo.', completeLessonFirst: 'Completa primero una lección y después entrena la memoria.', fsrsCompletedOnly: 'FSRS programa solo vocabulario de las lecciones que realmente completaste.',
  },
};

export function normalizeLanguage(value?: string): SupportedLanguage {
  return supportedLanguages.some(item => item.value === value) ? value as SupportedLanguage : 'English';
}

export function t(language: string | undefined, key: string): string {
  const lang = normalizeLanguage(language);
  return copy[lang][key] || copy.English[key] || key;
}

export function directionFor(language?: string): 'ltr' | 'rtl' {
  return supportedLanguages.find(item => item.value === normalizeLanguage(language))?.dir || 'ltr';
}

export function immersionSupportPercent(level?: string): number {
  switch ((level || 'A1').toUpperCase()) {
    case 'A1': return 70;
    case 'A2': return 50;
    case 'B1': return 30;
    case 'B2': return 15;
    default: return 5;
  }
}
