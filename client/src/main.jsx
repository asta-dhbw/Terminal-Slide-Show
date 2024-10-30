import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import './styles/index.css';

const Main = () => {
  useEffect(() => {
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
      }
    };

    document.addEventListener('click', enterFullscreen, { once: true });

    return () => {
      document.removeEventListener('click', enterFullscreen);
    };
  }, []);

  return <App />;
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);