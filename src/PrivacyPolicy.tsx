import { ArrowLeft, BrainCircuit, Mic, ShieldCheck, Trash2 } from 'lucide-react';
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
            <p>This page explains, in plain language, what English Twin stores, why it is used, when AI services receive data and how you can delete it.</p>
          </header>

          <section className="signal-empty">
            <ShieldCheck />
            <div><b>Your learning data stays account-scoped.</b><p>Progress, review cards, review history, mistakes, profile settings, Twin memory and saved learning sessions are stored under your authenticated account. Firestore rules restrict user-owned data to the matching Firebase UID.</p></div>
          </section>

          <section className="signal-empty">
            <BrainCircuit />
            <div><b>AI Twin uses bounded learning context.</b><p>When you use AI Twin, the app may send your message plus a limited snapshot of relevant learning context such as recent mistakes, due review terms, completed lessons and recent conversation context to the configured AI provider. Passwords are never included in AI prompts.</p></div>
          </section>

          <section className="signal-empty">
            <Mic />
            <div><b>Voice features require explicit microphone permission.</b><p>Live speaking can stream microphone audio to the configured live AI provider only after you approve the voice consent screen. The resulting transcript and basic session metadata may be stored in your account to support progress and later practice.</p></div>
          </section>

          <section>
            <div className="section-heading"><span>CONTROL</span><h3>Your choices</h3></div>
            <div className="daily-plan">
              <div className="signal-empty"><div><b>Microphone access</b><p>You can refuse microphone permission and continue using non-voice learning modes.</p></div></div>
              <div className="signal-empty"><div><b>AI features</b><p>Core lessons, review and deterministic practice can operate separately from free-form AI chat and Live speaking.</p></div></div>
              <div className="signal-empty"><Trash2 /><div><b>Delete your account and learning data</b><p>From Profile → Delete account, you can permanently remove your profile, lesson progress, review history, saved mistakes, Twin memory, saved Live transcripts and Firebase account. A recent sign-in is required before destructive deletion begins.</p></div></div>
            </div>
          </section>

          <section className="signal-empty">
            <div><b>Retention</b><p>User-owned learning records are retained while the account remains active so English Twin can preserve progress and adaptive memory. Account deletion removes the app-managed user records covered above. Infrastructure and AI providers may separately retain limited operational or security records under their own policies.</p></div>
          </section>

          <section className="signal-empty">
            <div><b>Release note</b><p>This in-app disclosure describes the product's current data behavior. Before a public commercial launch, the published store/site privacy policy should also include the operator's legal identity, support/privacy contact details and any jurisdiction-specific disclosures required for the launch markets.</p></div>
          </section>
        </main>
      </div>
    </div>
  );
}
