import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import './styles/index.css';

const Main = () => {
  return <App />;
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);