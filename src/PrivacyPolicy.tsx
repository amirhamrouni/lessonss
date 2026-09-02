import { useEffect, useState } from 'react';
import { ArrowLeft, BrainCircuit, Mic, ShieldCheck, Trash2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { directionFor, normalizeLanguage, SupportedLanguage } from './languageSupport';
import { privacySupportCopy } from './privacySupportCopy';

export default function PrivacyPolicy() {
  const nav = useNavigate();
  const [language, setLanguage] = useState<SupportedLanguage>('English');

  useEffect(() => onAuthStateChanged(auth, async current => {
    if (!current) { setLanguage('English'); return; }
    try {
      const snap = await getDoc(doc(db, 'users', current.uid));
      const data = snap.exists() ? snap.data() : {};
      setLanguage(normalizeLanguage(data.explanationLanguage || data.nativeLanguage || data.interfaceLanguage || 'English'));
    } catch {
      setLanguage('English');
    }
  }), []);

  const copy = privacySupportCopy[language];
  const dir = directionFor(language);

  return (
    <div className="app-shell" dir={dir}>
      <div className="phone">
        <main className="page">
          <button className="back" onClick={() => nav(-1)}><ArrowLeft /> {copy.back}</button>
          <header>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
          </header>

          <section className="signal-empty">
            <ShieldCheck />
            <div><b>{copy.scopedTitle}</b><p>{copy.scopedBody}</p></div>
          </section>

          <section className="signal-empty">
            <BrainCircuit />
            <div><b>{copy.aiTitle}</b><p>{copy.aiBody}</p></div>
          </section>

          <section className="signal-empty">
            <Mic />
            <div><b>{copy.voiceTitle}</b><p>{copy.voiceBody}</p></div>
          </section>

          <section>
            <div className="section-heading"><span>{copy.control}</span><h3>{copy.choices}</h3></div>
            <div className="daily-plan">
              <div className="signal-empty"><div><b>{copy.micTitle}</b><p>{copy.micBody}</p></div></div>
              <div className="signal-empty"><div><b>{copy.aiChoiceTitle}</b><p>{copy.aiChoiceBody}</p></div></div>
              <div className="signal-empty"><Trash2 /><div><b>{copy.deleteTitle}</b><p>{copy.deleteBody}</p></div></div>
            </div>
          </section>

          <section className="signal-empty">
            <div><b>{copy.retentionTitle}</b><p>{copy.retentionBody}</p></div>
          </section>

          <section className="signal-empty">
            <div><b>{copy.releaseTitle}</b><p>{copy.releaseBody}</p></div>
          </section>
        </main>
      </div>
    </div>
  );
}
