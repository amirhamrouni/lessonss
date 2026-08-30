import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import SmartHome from './SmartHome';
import { AssessmentMode, PracticeHub, ReviewMode, SentenceBuilderMode } from './LearningModes';
import { LearnJourney, UnifiedLessonPlayer } from './LearningPath';
import './styles.css';
import './lesson.css';
import './twin.css';
import './modes.css';

function Root() {
  return (
    <Routes>
      <Route path="/" element={<SmartHome />} />
      <Route path="/learn" element={<LearnJourney />} />
      <Route path="/lesson/:lessonId" element={<UnifiedLessonPlayer />} />
      <Route path="/practice" element={<PracticeHub />} />
      <Route path="/review" element={<ReviewMode />} />
      <Route path="/sentence-builder" element={<SentenceBuilderMode />} />
      <Route path="/assessment" element={<AssessmentMode />} />
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
