import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import SmartHomeV2 from './SmartHomeV2';
import LearnerSetup from './LearnerSetup';
import { AssessmentMode, PracticeHub, ReviewMode, SentenceBuilderMode } from './LearningModes';
import { LearnJourney } from './LearningPath';
import AutoLessonPlayer from './AutoLessonPlayer';
import TutorMode from './TutorMode';
import { MistakeMemory, ProfileHub } from './ProfileHub';
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
      <Route path="/lesson/:lessonId" element={<AutoLessonPlayer />} />
      <Route path="/practice" element={<PracticeHub />} />
      <Route path="/review" element={<ReviewMode />} />
      <Route path="/sentence-builder" element={<SentenceBuilderMode />} />
      <Route path="/assessment" element={<AssessmentMode />} />
      <Route path="/twin" element={<TutorMode />} />
      <Route path="/profile" element={<ProfileHub />} />
      <Route path="/mistakes" element={<MistakeMemory />} />
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
