import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import SmartHomeV2 from './SmartHomeV2';
import LearnerSetup from './LearnerSetup';
import { AssessmentMode, PracticeHub, ReviewMode, SentenceBuilderMode } from './LearningModes';
import { LearnJourney, UnifiedLessonPlayer } from './LearningPath';
import TwinCoach from './TwinCoach';
import './styles.css';
import './lesson.css';
import './twin.css';
import './modes.css';
import './language.css';

function Root() {
  return (
    <Routes>
      <Route path="/" element={<SmartHomeV2 />} />
      <Route path="/setup" element={<LearnerSetup />} />
      <Route path="/learn" element={<LearnJourney />} />
      <Route path="/lesson/:lessonId" element={<UnifiedLessonPlayer />} />
      <Route path="/practice" element={<PracticeHub />} />
      <Route path="/review" element={<ReviewMode />} />
      <Route path="/sentence-builder" element={<SentenceBuilderMode />} />
      <Route path="/assessment" element={<AssessmentMode />} />
      <Route path="/twin" element={<TwinCoach />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
