import { SupportedLanguage } from './languageSupport';

type TwinCopy = {
  loading: string;
  backPractice: string;
  eyebrow: string;
  title: string;
  intro: string;
  memoryTitle: string;
  progressFallback: string;
  reviewPrefix: string;
  twin: string;
  you: string;
  natural: string;
  tryPrefix: string;
  thinking: string;
  placeholder: string;
  unavailable: string;
};

export const twinSupportCopy: Record<SupportedLanguage, TwinCopy> = {
  English: {
    loading: 'Loading your Twin memory…', backPractice: 'Practice', eyebrow: 'AI LANGUAGE COACH · LEARNER MEMORY', title: 'English Twin',
    intro: 'Your Twin uses your level, completed lessons, repeated mistakes, due vocabulary and recent conversation — not a blank chat.',
    memoryTitle: 'What your Twin is watching', progressFallback: 'learning progress', reviewPrefix: 'review', twin: 'TWIN', you: 'YOU',
    natural: 'More natural', tryPrefix: 'Try', thinking: 'Reading your learning context and preparing the next useful step…',
    placeholder: 'Say something in English…', unavailable: 'Your Twin is temporarily unavailable. Please try again.',
  },
  Arabic: {
    loading: 'نحمّل ذاكرة English Twin…', backPractice: 'التمارين', eyebrow: 'مدرب AI · ذاكرة المتعلم', title: 'English Twin',
    intro: 'يستعمل Twin مستواك ودروسك وأخطائك المتكررة وكلمات المراجعة والمحادثات الأخيرة، وليس محادثة فارغة.',
    memoryTitle: 'ما الذي يراقبه Twin الآن', progressFallback: 'تقدمك في التعلم', reviewPrefix: 'مراجعة', twin: 'TWIN', you: 'أنت',
    natural: 'صياغة أكثر طبيعية', tryPrefix: 'جرّب', thinking: 'نراجع سياق تعلمك ونحضّر الخطوة الأنسب…',
    placeholder: 'اكتب شيئًا بالإنجليزية…', unavailable: 'Twin غير متاح مؤقتًا. حاول مرة أخرى.',
  },
  Dutch: {
    loading: 'Je Twin-geheugen wordt geladen…', backPractice: 'Oefenen', eyebrow: 'AI-TAALCOACH · LEERLINGGEHEUGEN', title: 'English Twin',
    intro: 'Je Twin gebruikt je niveau, voltooide lessen, terugkerende fouten, herhaalwoorden en recente gesprekken — geen lege chat.',
    memoryTitle: 'Waar je Twin nu op let', progressFallback: 'leerprogressie', reviewPrefix: 'herhalen', twin: 'TWIN', you: 'JIJ',
    natural: 'Natuurlijker', tryPrefix: 'Probeer', thinking: 'Je leercontext wordt bekeken en de nuttigste volgende stap wordt voorbereid…',
    placeholder: 'Zeg iets in het Engels…', unavailable: 'Je Twin is tijdelijk niet beschikbaar. Probeer opnieuw.',
  },
  French: {
    loading: 'Chargement de la mémoire de ton Twin…', backPractice: 'Pratique', eyebrow: 'COACH IA · MÉMOIRE APPRENANT', title: 'English Twin',
    intro: 'Ton Twin utilise ton niveau, tes leçons terminées, tes erreurs récurrentes, le vocabulaire à revoir et tes échanges récents.',
    memoryTitle: 'Ce que ton Twin surveille', progressFallback: 'progression', reviewPrefix: 'révision', twin: 'TWIN', you: 'TOI',
    natural: 'Plus naturel', tryPrefix: 'Essaie', thinking: 'Analyse de ton contexte d’apprentissage et préparation de la prochaine étape utile…',
    placeholder: 'Écris quelque chose en anglais…', unavailable: 'Ton Twin est temporairement indisponible. Réessaie.',
  },
  German: {
    loading: 'Dein Twin-Gedächtnis wird geladen…', backPractice: 'Üben', eyebrow: 'KI-SPRACHCOACH · LERNERGEDÄCHTNIS', title: 'English Twin',
    intro: 'Dein Twin nutzt dein Niveau, abgeschlossene Lektionen, wiederkehrende Fehler, fällige Wörter und letzte Gespräche.',
    memoryTitle: 'Worauf dein Twin gerade achtet', progressFallback: 'Lernfortschritt', reviewPrefix: 'Wiederholung', twin: 'TWIN', you: 'DU',
    natural: 'Natürlicher', tryPrefix: 'Versuche', thinking: 'Dein Lernkontext wird ausgewertet und der nächste sinnvolle Schritt vorbereitet…',
    placeholder: 'Schreibe etwas auf Englisch…', unavailable: 'Dein Twin ist vorübergehend nicht verfügbar. Versuche es erneut.',
  },
  Spanish: {
    loading: 'Cargando la memoria de tu Twin…', backPractice: 'Práctica', eyebrow: 'COACH IA · MEMORIA DEL ALUMNO', title: 'English Twin',
    intro: 'Tu Twin usa tu nivel, lecciones completadas, errores repetidos, vocabulario pendiente y conversaciones recientes.',
    memoryTitle: 'En qué se fija tu Twin', progressFallback: 'progreso de aprendizaje', reviewPrefix: 'repaso', twin: 'TWIN', you: 'TÚ',
    natural: 'Más natural', tryPrefix: 'Prueba', thinking: 'Revisando tu contexto de aprendizaje y preparando el siguiente paso útil…',
    placeholder: 'Escribe algo en inglés…', unavailable: 'Tu Twin no está disponible temporalmente. Inténtalo de nuevo.',
  },
};
