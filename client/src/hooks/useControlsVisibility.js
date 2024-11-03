import { useState, useEffect } from 'react';
import { config } from '../../../config/config.js';

/**
 * Custom hook that manages visibility of controls based on user activity
 * @param {number} [timeout=config.sync.controlsInterval] - Time in ms before controls auto-hide
 * @returns {boolean} Current visibility state of controls
 */
export const useControlsVisibility = (timeout = config.sync.controlsInterval) => {
  const [showControls, setShowControls] = useState(true);

  /**
   * Sets up event listeners for user activity and handles auto-hide timer
   */
  useEffect(() => {
    let hideTimer;

    /**
     * Shows controls and resets auto-hide timer on user activity
     * @function
     */
    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowControls(false), timeout);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    handleActivity(); // Initial timer setup

    // Cleanup 
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearTimeout(hideTimer);
    };
  }, [timeout]);

  return showControls;
};

export default useControlsVisibility;