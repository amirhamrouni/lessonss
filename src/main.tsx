import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './AppErrorBoundary';
import './styles.css';
import './lesson.css';
import './twin.css';
import './modes.css';
import './language.css';
import './beginner.css';

const App = React.lazy(() => import('./App'));
const SmartHomeV2 = React.lazy(() => import('./SmartHomeV2'));
const LearnerSetup = React.lazy(() => import('./LearnerSetup'));
const BeginnerFoundation = React.lazy(() => import('./BeginnerFoundation'));
const AdaptiveSentenceBuilder = React.lazy(() => import('./AdaptiveSentenceBuilder'));
const AutoLessonPlayer = React.lazy(() => import('./AutoLessonPlayer'));
const TutorMode = React.lazy(() => import('./TutorMode'));
const SpeechDrill = React.lazy(() => import('./SpeechDrill'));
const VoiceLab = React.lazy(() => import('./VoiceLab'));
const LearnJourney = React.lazy(() => import('./LearningPath').then(module => ({ default: module.LearnJourney })));
const PracticeHub = React.lazy(() => import('./LearningModes').then(module => ({ default: module.PracticeHub })));
const ReviewMode = React.lazy(() => import('./LearningModes').then(module => ({ default: module.ReviewMode })));
const AssessmentMode = React.lazy(() => import('./LearningModes').then(module => ({ default: module.AssessmentMode })));
const ProfileHub = React.lazy(() => import('./ProfileHub').then(module => ({ default: module.ProfileHub })));
const MistakeMemory = React.lazy(() => import('./ProfileHub').then(module => ({ default: module.MistakeMemory })));

function RouteFallback() {
  return <div className="app-shell"><div className="phone"><main className="page"><p>Loading English Twin…</p></main></div></div>;
}

function Root() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<SmartHomeV2 />} />
          <Route path="/setup" element={<LearnerSetup />} />
          <Route path="/start" element={<BeginnerFoundation />} />
          <Route path="/learn" element={<LearnJourney />} />
          <Route path="/lesson/:lessonId" element={<AutoLessonPlayer />} />
          <Route path="/practice" element={<PracticeHub />} />
          <Route path="/review" element={<ReviewMode />} />
          <Route path="/sentence-builder" element={<AdaptiveSentenceBuilder />} />
          <Route path="/assessment" element={<AssessmentMode />} />
          <Route path="/twin" element={<TutorMode />} />
          <Route path="/speak" element={<SpeechDrill />} />
          <Route path="/speak/live" element={<VoiceLab />} />
          <Route path="/profile" element={<ProfileHub />} />
          <Route path="/mistakes" element={<MistakeMemory />} />
          <Route path="/*" element={<App />} />
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
