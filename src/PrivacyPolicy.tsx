import { useEffect, useState } from 'react';
import { ArrowLeft, BrainCircuit, FileText, Mic, ShieldCheck, Trash2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
import { privacySupportCopy } from './privacySupportCopy';

const advancedCopy:Record<SupportedLanguage,{title:string;body:string}>={
  English:{title:'Advanced writing can use structured AI evaluation.',body:'For B1–C1 open-response tasks, your submitted writing or speech transcript, the task prompt and only the source texts needed for that task may be sent to the configured AI service. English Twin validates a structured rubric response, calculates the final score in app logic, and may store your draft, attempt, rubric evidence, score and remediation targets under your account.'},
  Arabic:{title:'يمكن أن تستخدم الكتابة المتقدمة تقييمًا منظمًا بالذكاء الاصطناعي.',body:'في تمارين B1–C1 المفتوحة قد تُرسل كتابتك أو نص كلامك، وتعليمات التمرين، والمصادر الضرورية لذلك التمرين فقط إلى خدمة الذكاء الاصطناعي المهيأة. يتحقق English Twin من نتيجة تقييم منظمة ويحسب الدرجة النهائية بمنطق التطبيق، وقد يحفظ المسودة والمحاولة وأدلة التقييم والدرجة وأهداف المعالجة داخل حسابك.'},
  Dutch:{title:'Geavanceerd schrijven kan gestructureerde AI-beoordeling gebruiken.',body:'Bij open B1–C1-taken kunnen je ingediende tekst of spraaktranscript, de opdracht en alleen de benodigde bronteksten naar de ingestelde AI-dienst worden gestuurd. English Twin valideert een gestructureerde rubric, berekent de eindscore in de app en kan concepten, pogingen, rubric-bewijs, scores en verbeterdoelen in je account bewaren.'},
  French:{title:'Les tâches avancées peuvent utiliser une évaluation IA structurée.',body:'Pour les réponses ouvertes B1–C1, ton texte ou transcript oral, la consigne et uniquement les sources nécessaires peuvent être envoyés au service IA configuré. English Twin valide une grille structurée, calcule le score final dans la logique de l’application et peut enregistrer brouillons, tentatives, preuves de grille, scores et objectifs de remédiation dans ton compte.'},
  German:{title:'Fortgeschrittene Aufgaben können strukturierte KI-Bewertung nutzen.',body:'Bei offenen B1–C1-Aufgaben können dein Text oder Sprachtranskript, die Aufgabe und nur die dafür benötigten Quelltexte an den konfigurierten KI-Dienst gesendet werden. English Twin validiert ein strukturiertes Bewertungsraster, berechnet die Endpunktzahl in der App und kann Entwürfe, Versuche, Bewertungsbelege, Ergebnisse und Förderziele in deinem Konto speichern.'},
  Spanish:{title:'Las tareas avanzadas pueden usar evaluación de IA estructurada.',body:'En tareas abiertas B1–C1, tu texto o transcripción oral, la consigna y solo las fuentes necesarias pueden enviarse al servicio de IA configurado. English Twin valida una rúbrica estructurada, calcula la puntuación final mediante lógica de la app y puede guardar borradores, intentos, evidencias de rúbrica, puntuaciones y objetivos de refuerzo en tu cuenta.'},
};

export default function PrivacyPolicy() {
  const nav = useNavigate();
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  useEffect(() => onAuthStateChanged(auth, async current => { if (!current) { setLanguage('English'); return; } try { const snap = await getDoc(doc(db, 'users', current.uid)); const data = snap.exists() ? snap.data() : {}; setLanguage(normalizeLanguage(data.explanationLanguage || data.nativeLanguage || data.interfaceLanguage || 'English')); } catch { setLanguage('English'); } }), []);
  const copy = privacySupportCopy[language];
  const advanced=advancedCopy[language];
  const dir = directionFor(language);
  return <div className="app-shell" dir={dir}><div className="phone"><main className="page">
    <button className="back" onClick={() => nav(-1)}><ArrowLeft /> {copy.back}</button>
    <header><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></header>
    <section className="signal-empty"><ShieldCheck /><div><b>{copy.scopedTitle}</b><p>{copy.scopedBody}</p></div></section>
    <section className="signal-empty"><BrainCircuit /><div><b>{copy.aiTitle}</b><p>{copy.aiBody}</p></div></section>
    <section className="signal-empty"><FileText/><div><b>{advanced.title}</b><p>{advanced.body}</p></div></section>
    <section className="signal-empty"><Mic /><div><b>{copy.voiceTitle}</b><p>{copy.voiceBody}</p></div></section>
    <section><div className="section-heading"><span>{copy.control}</span><h3>{copy.choices}</h3></div><div className="daily-plan"><div className="signal-empty"><div><b>{copy.micTitle}</b><p>{copy.micBody}</p></div></div><div className="signal-empty"><div><b>{copy.aiChoiceTitle}</b><p>{copy.aiChoiceBody}</p></div></div><div className="signal-empty"><Trash2 /><div><b>{copy.deleteTitle}</b><p>{copy.deleteBody}</p></div></div></div></section>
    <section className="signal-empty"><div><b>{copy.retentionTitle}</b><p>{copy.retentionBody}</p></div></section>
    <section className="signal-empty"><div><b>{copy.releaseTitle}</b><p>{copy.releaseBody}</p></div></section>
  </main></div></div>;
}
