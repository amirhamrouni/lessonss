import { ArrowLeft, BrainCircuit, Mic, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const nav = useNavigate();
  return (
    <div className="app-shell">
      <div className="phone">
        <main className="page">
          <button className="back" onClick={() => nav(-1)}><ArrowLeft /> Back</button>
          <header>
            <span className="eyebrow">ENGLISH TWIN · PRIVACY</span>
            <h1>Privacy & AI data</h1>
            <p>This page explains, in plain language, what the app stores and when external AI services receive data.</p>
          </header>

          <section className="signal-empty">
            <ShieldCheck />
            <div><b>Your learning data stays account-scoped.</b><p>Progress, review cards, mistakes, settings and saved learning sessions are stored under your authenticated user account. Firestore rules restrict user-owned data to the matching Firebase UID.</p></div>
          </section>

          <section className="signal-empty">
            <BrainCircuit />
            <div><b>AI Twin uses only bounded learning context.</b><p>When you use AI Twin, the app may send your message plus a limited snapshot of relevant learning context such as recent mistakes, due review terms, completed lessons and recent conversation context to the configured AI provider. The app does not send your password.</p></div>
          </section>

          <section className="signal-empty">
            <Mic />
            <div><b>Voice features require explicit microphone permission.</b><p>Live speaking can stream microphone audio to the configured live AI provider after you approve the voice consent screen. A transcript and basic session metadata may be saved to your own learning account so the app can support future practice and progress features.</p></div>
          </section>

          <section>
            <div className="section-heading"><span>CONTROL</span><h3>What you can choose</h3></div>
            <div className="daily-plan">
              <div className="signal-empty"><div><b>Microphone access</b><p>You can refuse microphone permission and continue using non-voice learning modes.</p></div></div>
              <div className="signal-empty"><div><b>AI features</b><p>Core lesson, review and deterministic practice features can operate separately from free-form AI chat.</p></div></div>
            </div>
          </section>

          <section className="signal-empty">
            <div><b>Release note</b><p>This in-app notice is a product disclosure, not a substitute for a final jurisdiction-specific legal privacy policy or terms of service. Those documents should be reviewed before public commercial launch.</p></div>
          </section>
        </main>
      </div>
    </div>
  );
}
