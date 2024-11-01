import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './app';
import DynamicDailyView from './components/dynamicDailyView';
import './styles/index.css';

const Main = () => (
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/dynamic-view" element={<DynamicDailyView />} />
    </Routes>
  </Router>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);