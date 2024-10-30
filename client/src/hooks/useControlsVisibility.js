import { useState, useEffect } from 'react';
import { config } from '../../../config/config.js';

export const useControlsVisibility = (timeout = config.sync.controlsInterval) => {
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let hideTimer;

    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowControls(false), timeout);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearTimeout(hideTimer);
    };
  }, [timeout]);

  return showControls;
};

export default useControlsVisibility;