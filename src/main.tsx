import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './AppErrorBoundary';
import './design-tokens.css';
import './styles.css';
import './lesson.css';
import './twin.css';
import './modes.css';
import './language.css';
import './beginner.css';
import './auth-onboarding-polish.css';
import './pronunciation-lab.css';
import './live-voice-v11.css';
import './product-system-v12.css';
import './advanced-learning-v12.css';
import './product-system-v13.css';

const AuthGateway = React.lazy(() => import('./AuthGateway'));
const SmartHomeV2 = React.lazy(() => import('./SmartHomeV2'));
const LearnerSetup = React.lazy(() => import('./LearnerSetup'));
const BeginnerFoundation = React.lazy(() => import('./BeginnerFoundation'));
const AdaptiveSentenceBuilder = React.lazy(() => import('./AdaptiveSentenceBuilder'));
const LessonRouter = React.lazy(() => import('./LessonRouter'));
const TutorMode = React.lazy(() => import('./TutorMode'));
const SpeechDrill = React.lazy(() => import('./SpeechDrill'));
const PronunciationGateway = React.lazy(() => import('./PronunciationGateway'));
const VoiceLab = React.lazy(() => import('./VoiceLab'));
const PrivacyPolicy = React.lazy(() => import('./PrivacyPolicy'));
const LearnJourney = React.lazy(() => import('./ReferenceLearnJourney'));
const PracticeHub = React.lazy(() => import('./LearningModes').then(module => ({ default: module.PracticeHub })));
const ReviewMode = React.lazy(() => import('./LearningModes').then(module => ({ default: module.ReviewMode })));
const AssessmentV2 = React.lazy(() => import('./AssessmentV2'));
const LevelCheckpoint = React.lazy(() => import('./LevelCheckpoint'));
const ProfileHub = React.lazy(() => import('./ProfileHub').then(module => ({ default: module.ProfileHub })));
const MistakeMemory = React.lazy(() => import('./ProfileHub').then(module => ({ default: module.MistakeMemory })));

function RouteFallback() {
  return <div className="app-shell"><div className="phone"><main className="page"><section className="mode-empty route-loading" aria-live="polite"><span className="eyebrow">ENGLISH TWIN</span><h2>Loading your learning space…</h2><p>Your saved progress stays in place while this screen opens.</p></section></main></div></div>;
}

function Root() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/welcome" element={<AuthGateway />} />
          <Route path="/" element={<SmartHomeV2 />} />
          <Route path="/setup" element={<LearnerSetup />} />
          <Route path="/start" element={<BeginnerFoundation />} />
          <Route path="/learn" element={<LearnJourney />} />
          <Route path="/lesson/:lessonId" element={<LessonRouter />} />
          <Route path="/practice" element={<PracticeHub />} />
          <Route path="/review" element={<ReviewMode />} />
          <Route path="/sentence-builder" element={<AdaptiveSentenceBuilder />} />
          <Route path="/assessment" element={<AssessmentV2 />} />
          <Route path="/checkpoint" element={<LevelCheckpoint />} />
          <Route path="/twin" element={<TutorMode />} />
          <Route path="/speak" element={<SpeechDrill />} />
          <Route path="/pronunciation" element={<PronunciationGateway />} />
          <Route path="/speak/live" element={<VoiceLab />} />
          <Route path="/profile" element={<ProfileHub />} />
          <Route path="/mistakes" element={<MistakeMemory />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBase}>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
