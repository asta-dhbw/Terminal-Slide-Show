import { useState, useEffect } from 'react';

export const useControlsVisibility = (timeout = 3000) => {
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