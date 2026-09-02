import { SupportedLanguage } from './languageSupport';

type ModeSupportCopy = {
  backPractice: string;
  smartReview: string;
  cardsDue: (count: number) => string;
  caughtUp: string;
  caughtUpBody: string;
  backToPractice: string;
  vocabularyLeft: (count: number) => string;
  recallBeforeReveal: string;
  revealAnswer: string;
  hearExample: string;
  again: string;
  againHint: string;
  hard: string;
  hardHint: string;
  good: string;
  goodHint: string;
  easy: string;
  easyHint: string;
  placementCurrent: (level: string) => string;
  placementDescription: string;
  placementResult: string;
  overall: (percent: number) => string;
  correctOf: (correct: number, total: number) => string;
  retakeAssessment: string;
  cefrDiagnostic: string;
  placement: string;
  placementIntro: string;
  chooseEnglish: string;
  finishAssessment: string;
  nextQuestion: string;
  saving: string;
  skills: Record<string, string>;
};

export const modeSupportCopy: Record<SupportedLanguage, ModeSupportCopy> = {
  English: {
    backPractice:'Practice', smartReview:'Smart Review', cardsDue:count=>`${count} cards due now.`, caughtUp:'You’re caught up.', caughtUpBody:'FSRS will bring items back when memory strength predicts they should be reviewed.', backToPractice:'Back to practice', vocabularyLeft:count=>`VOCABULARY · ${count} LEFT`, recallBeforeReveal:'Recall the meaning before revealing it.', revealAnswer:'Reveal answer', hearExample:'Hear example', again:'Again', againHint:'Forgot', hard:'Hard', hardHint:'Struggled', good:'Good', goodHint:'Recalled', easy:'Easy', easyHint:'Instant', placementCurrent:level=>`Current placement: ${level}. Retake any time.`, placementDescription:'Deterministic CEFR diagnostic across grammar, vocabulary and reading.', placementResult:'PLACEMENT RESULT', overall:percent=>`${percent}% overall`, correctOf:(correct,total)=>`${correct} of ${total} deterministic questions correct.`, retakeAssessment:'Retake assessment', cefrDiagnostic:'CEFR DIAGNOSTIC', placement:'Placement', placementIntro:'No self-rating shortcuts. Answer what you actually know.', chooseEnglish:'Choose the correct English answer.', finishAssessment:'Finish assessment', nextQuestion:'Next question', saving:'Saving…', skills:{Grammar:'Grammar',Vocabulary:'Vocabulary',Reading:'Reading'},
  },
  Arabic: {
    backPractice:'التدريب', smartReview:'المراجعة الذكية', cardsDue:count=>`${count} بطاقات مستحقة الآن.`, caughtUp:'أنت مواكب للمراجعة.', caughtUpBody:'سيعيد FSRS الكلمات عندما يتوقع أن الذاكرة تحتاج إلى تعزيز.', backToPractice:'العودة للتدريب', vocabularyLeft:count=>`مفردات · ${count} متبقية`, recallBeforeReveal:'تذكّر المعنى أولًا، ثم اكشف الإجابة.', revealAnswer:'اكشف المعنى', hearExample:'اسمع المثال', again:'نسيت', againHint:'أعدها قريبًا', hard:'صعب', hardHint:'تذكّرت بصعوبة', good:'جيد', goodHint:'تذكّرت', easy:'سهل', easyHint:'فوري', placementCurrent:level=>`مستواك المقاس حاليًا: ${level}. يمكنك إعادة الاختبار في أي وقت.`, placementDescription:'اختبار CEFR ثابت يقيس القواعد والمفردات والقراءة بدون تخمين ذاتي.', placementResult:'نتيجة تحديد المستوى', overall:percent=>`${percent}% النتيجة الإجمالية`, correctOf:(correct,total)=>`${correct} إجابات صحيحة من أصل ${total} سؤالًا ثابتًا.`, retakeAssessment:'إعادة الاختبار', cefrDiagnostic:'تشخيص CEFR', placement:'تحديد المستوى', placementIntro:'بدون تقييم ذاتي أو تخمين. أجب فقط عمّا تعرفه فعلًا.', chooseEnglish:'اختر الإجابة الإنجليزية الصحيحة.', finishAssessment:'إنهاء الاختبار', nextQuestion:'السؤال التالي', saving:'جارٍ الحفظ…', skills:{Grammar:'القواعد',Vocabulary:'المفردات',Reading:'القراءة'},
  },
  Dutch: {
    backPractice:'Oefenen', smartReview:'Slim herhalen', cardsDue:count=>`${count} kaarten zijn nu aan de beurt.`, caughtUp:'Je bent helemaal bij.', caughtUpBody:'FSRS brengt woorden terug wanneer je geheugen waarschijnlijk versterking nodig heeft.', backToPractice:'Terug naar oefenen', vocabularyLeft:count=>`WOORDENSCHAT · ${count} OVER`, recallBeforeReveal:'Probeer eerst de betekenis te herinneren en toon daarna het antwoord.', revealAnswer:'Toon betekenis', hearExample:'Luister naar voorbeeld', again:'Opnieuw', againHint:'Vergeten', hard:'Moeilijk', hardHint:'Met moeite', good:'Goed', goodHint:'Herinnerd', easy:'Makkelijk', easyHint:'Direct', placementCurrent:level=>`Huidig gemeten niveau: ${level}. Je kunt de test altijd opnieuw doen.`, placementDescription:'Een vaste CEFR-test voor grammatica, woordenschat en lezen.', placementResult:'NIVEAURESULTAAT', overall:percent=>`${percent}% totaal`, correctOf:(correct,total)=>`${correct} van ${total} vaste vragen correct.`, retakeAssessment:'Test opnieuw doen', cefrDiagnostic:'CEFR-NIVEAUTEST', placement:'Niveaubepaling', placementIntro:'Geen zelfinschatting. Beantwoord alleen wat je echt weet.', chooseEnglish:'Kies het juiste Engelse antwoord.', finishAssessment:'Test afronden', nextQuestion:'Volgende vraag', saving:'Opslaan…', skills:{Grammar:'Grammatica',Vocabulary:'Woordenschat',Reading:'Lezen'},
  },
  French: {
    backPractice:'Pratique', smartReview:'Révision intelligente', cardsDue:count=>`${count} cartes à réviser maintenant.`, caughtUp:'Tu es à jour.', caughtUpBody:'FSRS fera revenir les éléments lorsque ta mémoire aura besoin d’être renforcée.', backToPractice:'Retour à la pratique', vocabularyLeft:count=>`VOCABULAIRE · ${count} RESTANTES`, recallBeforeReveal:'Rappelle-toi d’abord le sens, puis affiche la réponse.', revealAnswer:'Afficher le sens', hearExample:'Écouter l’exemple', again:'Encore', againHint:'Oublié', hard:'Difficile', hardHint:'Avec effort', good:'Bien', goodHint:'Retenu', easy:'Facile', easyHint:'Immédiat', placementCurrent:level=>`Niveau mesuré actuel : ${level}. Tu peux refaire le test à tout moment.`, placementDescription:'Diagnostic CECR déterministe en grammaire, vocabulaire et lecture.', placementResult:'RÉSULTAT DE NIVEAU', overall:percent=>`${percent}% au total`, correctOf:(correct,total)=>`${correct} bonnes réponses sur ${total} questions fixes.`, retakeAssessment:'Refaire le test', cefrDiagnostic:'DIAGNOSTIC CECR', placement:'Niveau', placementIntro:'Pas d’auto-évaluation. Réponds uniquement à ce que tu sais vraiment.', chooseEnglish:'Choisis la bonne réponse en anglais.', finishAssessment:'Terminer le test', nextQuestion:'Question suivante', saving:'Enregistrement…', skills:{Grammar:'Grammaire',Vocabulary:'Vocabulaire',Reading:'Lecture'},
  },
  German: {
    backPractice:'Üben', smartReview:'Intelligente Wiederholung', cardsDue:count=>`${count} Karten sind jetzt fällig.`, caughtUp:'Du bist auf dem aktuellen Stand.', caughtUpBody:'FSRS bringt Wörter zurück, wenn dein Gedächtnis voraussichtlich eine Auffrischung braucht.', backToPractice:'Zurück zum Üben', vocabularyLeft:count=>`WORTSCHATZ · ${count} ÜBRIG`, recallBeforeReveal:'Erinnere dich zuerst an die Bedeutung und decke dann die Antwort auf.', revealAnswer:'Bedeutung zeigen', hearExample:'Beispiel anhören', again:'Nochmal', againHint:'Vergessen', hard:'Schwer', hardHint:'Mit Mühe', good:'Gut', goodHint:'Erinnert', easy:'Leicht', easyHint:'Sofort', placementCurrent:level=>`Aktuell gemessenes Niveau: ${level}. Du kannst den Test jederzeit wiederholen.`, placementDescription:'Deterministischer GER-Test für Grammatik, Wortschatz und Lesen.', placementResult:'EINSTUFUNGSERGEBNIS', overall:percent=>`${percent}% gesamt`, correctOf:(correct,total)=>`${correct} von ${total} festen Fragen richtig.`, retakeAssessment:'Test wiederholen', cefrDiagnostic:'GER-DIAGNOSE', placement:'Einstufung', placementIntro:'Keine Selbsteinschätzung. Beantworte nur, was du wirklich weißt.', chooseEnglish:'Wähle die richtige englische Antwort.', finishAssessment:'Test beenden', nextQuestion:'Nächste Frage', saving:'Speichern…', skills:{Grammar:'Grammatik',Vocabulary:'Wortschatz',Reading:'Lesen'},
  },
  Spanish: {
    backPractice:'Practicar', smartReview:'Repaso inteligente', cardsDue:count=>`${count} tarjetas pendientes ahora.`, caughtUp:'Estás al día.', caughtUpBody:'FSRS volverá a mostrar elementos cuando prevea que tu memoria necesita refuerzo.', backToPractice:'Volver a practicar', vocabularyLeft:count=>`VOCABULARIO · ${count} RESTANTES`, recallBeforeReveal:'Recuerda primero el significado y después muestra la respuesta.', revealAnswer:'Mostrar significado', hearExample:'Escuchar ejemplo', again:'Otra vez', againHint:'Olvidado', hard:'Difícil', hardHint:'Con esfuerzo', good:'Bien', goodHint:'Recordado', easy:'Fácil', easyHint:'Instantáneo', placementCurrent:level=>`Nivel medido actual: ${level}. Puedes repetir la prueba cuando quieras.`, placementDescription:'Diagnóstico MCER determinista de gramática, vocabulario y lectura.', placementResult:'RESULTADO DE NIVEL', overall:percent=>`${percent}% total`, correctOf:(correct,total)=>`${correct} de ${total} preguntas fijas correctas.`, retakeAssessment:'Repetir prueba', cefrDiagnostic:'DIAGNÓSTICO MCER', placement:'Nivel', placementIntro:'Sin autoevaluación. Responde solo lo que realmente sabes.', chooseEnglish:'Elige la respuesta correcta en inglés.', finishAssessment:'Finalizar prueba', nextQuestion:'Siguiente pregunta', saving:'Guardando…', skills:{Grammar:'Gramática',Vocabulary:'Vocabulario',Reading:'Lectura'},
  },
};
