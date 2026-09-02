import type { SupportedLanguage } from './languageSupport';

type SetupCopy = {
  loading: string;
  languageEyebrow: string;
  languageTitle: string;
  languageBody: string;
  goalEyebrow: string;
  goalTitle: string;
  levelEyebrow: string;
  levelTitle: string;
  levelBody: string;
  minute: string;
  back: string;
  continue: string;
  saving: string;
  finish: string;
  goals: Record<string, string>;
};

export const setupSupportCopy: Record<SupportedLanguage, SetupCopy> = {
  English: {
    loading:'Preparing your learning setup…', languageEyebrow:'01 · YOUR LANGUAGE', languageTitle:'What language should your Twin use to teach you?', languageBody:'Instructions, hints and explanations use this language. Your answers stay in English.', goalEyebrow:'02 · OUTCOME', goalTitle:'What should English unlock for you?', levelEyebrow:'03 · STARTING POINT', levelTitle:'Set your starting level and daily rhythm.', levelBody:'The placement test can update each skill separately later.', minute:'min', back:'Back', continue:'Continue', saving:'Saving…', finish:'Build my Twin', goals:{'Daily conversation':'Daily conversation','Work':'Work','Travel':'Travel','Study':'Study','Moving abroad':'Moving abroad','Job interview':'Job interview'},
  },
  Arabic: {
    loading:'نجهّز إعداد تعلّمك…', languageEyebrow:'01 · لغتك', languageTitle:'ما اللغة التي تريد أن يستخدمها English Twin لشرح الإنجليزية لك؟', languageBody:'التعليمات والتلميحات والشرح تكون بلغتك. إجاباتك تبقى بالإنجليزية لأن الهدف هو تعلّم الإنجليزية.', goalEyebrow:'02 · هدفك', goalTitle:'لماذا تريد تعلّم الإنجليزية؟', levelEyebrow:'03 · نقطة البداية', levelTitle:'اختر مستواك الحالي والوقت الذي تستطيع الالتزام به يوميًا.', levelBody:'اختبار تحديد المستوى لاحقًا يمكنه قياس كل مهارة بشكل منفصل.', minute:'دقيقة', back:'رجوع', continue:'متابعة', saving:'جارٍ الحفظ…', finish:'ابدأ التعلّم', goals:{'Daily conversation':'المحادثة اليومية','Work':'العمل','Travel':'السفر','Study':'الدراسة','Moving abroad':'العيش في الخارج','Job interview':'مقابلة عمل'},
  },
  Dutch: {
    loading:'Je leerinstellingen worden voorbereid…', languageEyebrow:'01 · JOUW TAAL', languageTitle:'Welke taal moet English Twin gebruiken om Engels aan je uit te leggen?', languageBody:'Instructies, hints en uitleg gebruiken deze taal. Je antwoorden blijven Engels.', goalEyebrow:'02 · JOUW DOEL', goalTitle:'Wat wil je met Engels kunnen doen?', levelEyebrow:'03 · STARTPUNT', levelTitle:'Kies je startniveau en dagelijkse ritme.', levelBody:'De niveautest kan later elk onderdeel afzonderlijk bijwerken.', minute:'min', back:'Terug', continue:'Doorgaan', saving:'Opslaan…', finish:'Start met leren', goals:{'Daily conversation':'Dagelijkse gesprekken','Work':'Werk','Travel':'Reizen','Study':'Studie','Moving abroad':'Verhuizen naar het buitenland','Job interview':'Sollicitatiegesprek'},
  },
  French: {
    loading:'Préparation de tes réglages d’apprentissage…', languageEyebrow:'01 · TA LANGUE', languageTitle:'Quelle langue English Twin doit-il utiliser pour t’expliquer l’anglais ?', languageBody:'Les consignes, indices et explications utilisent cette langue. Tes réponses restent en anglais.', goalEyebrow:'02 · TON OBJECTIF', goalTitle:'Que veux-tu pouvoir faire grâce à l’anglais ?', levelEyebrow:'03 · POINT DE DÉPART', levelTitle:'Choisis ton niveau de départ et ton rythme quotidien.', levelBody:'Le test de niveau pourra ensuite mettre à jour chaque compétence séparément.', minute:'min', back:'Retour', continue:'Continuer', saving:'Enregistrement…', finish:'Commencer à apprendre', goals:{'Daily conversation':'Conversation quotidienne','Work':'Travail','Travel':'Voyage','Study':'Études','Moving abroad':'Vivre à l’étranger','Job interview':'Entretien d’embauche'},
  },
  German: {
    loading:'Deine Lerneinstellungen werden vorbereitet…', languageEyebrow:'01 · DEINE SPRACHE', languageTitle:'In welcher Sprache soll English Twin dir Englisch erklären?', languageBody:'Anweisungen, Hinweise und Erklärungen verwenden diese Sprache. Deine Antworten bleiben auf Englisch.', goalEyebrow:'02 · DEIN ZIEL', goalTitle:'Was möchtest du mit Englisch erreichen?', levelEyebrow:'03 · STARTPUNKT', levelTitle:'Lege dein Startniveau und deinen täglichen Rhythmus fest.', levelBody:'Der Einstufungstest kann später jede Fähigkeit einzeln aktualisieren.', minute:'Min.', back:'Zurück', continue:'Weiter', saving:'Speichern…', finish:'Lernen starten', goals:{'Daily conversation':'Alltagsgespräche','Work':'Arbeit','Travel':'Reisen','Study':'Studium','Moving abroad':'Im Ausland leben','Job interview':'Vorstellungsgespräch'},
  },
  Spanish: {
    loading:'Preparando tu configuración de aprendizaje…', languageEyebrow:'01 · TU IDIOMA', languageTitle:'¿Qué idioma debe usar English Twin para explicarte el inglés?', languageBody:'Las instrucciones, pistas y explicaciones usan este idioma. Tus respuestas siguen siendo en inglés.', goalEyebrow:'02 · TU OBJETIVO', goalTitle:'¿Qué quieres conseguir con el inglés?', levelEyebrow:'03 · PUNTO DE PARTIDA', levelTitle:'Elige tu nivel inicial y tu ritmo diario.', levelBody:'La prueba de nivel podrá actualizar cada habilidad por separado más adelante.', minute:'min', back:'Atrás', continue:'Continuar', saving:'Guardando…', finish:'Empezar a aprender', goals:{'Daily conversation':'Conversación diaria','Work':'Trabajo','Travel':'Viajes','Study':'Estudios','Moving abroad':'Vivir en el extranjero','Job interview':'Entrevista de trabajo'},
  },
};
