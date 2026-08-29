import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { AssessmentMode, PracticeHub, ReviewMode, SentenceBuilderMode } from './LearningModes';
import './styles.css';
import './lesson.css';
import './twin.css';
import './modes.css';

function Root() {
  return (
    <Routes>
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
