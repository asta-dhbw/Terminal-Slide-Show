import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMediaLoader } from '../hooks/useMediaLoader';
import { useControlsVisibility } from '../hooks/useControlsVisibility';
import { useServerStatus } from '../hooks/useServerStatus';
import { useSchedule } from '../hooks/useSchedule';
import MediaCanvas from './mediaCanvas';
import Controls from './controls';
import Loading from './loading';
import ErrorToast from './errorToast';
import DynamicDailyView from './dynamicDailyView';
import { config } from '../../../config/config';

const Slideshow = () => {
  const { media, loading, error, serverReady, navigateMedia } = useMediaLoader();
  const showControls = useControlsVisibility();
  const isServerConnected = useServerStatus();
  const isScheduleActive = useSchedule();
  const [currentView, setCurrentView] = useState('dynamic'); // 'dynamic' or 'media'
  const [paused, setPaused] = useState(false);
  const autoContinueTimer = useRef(null);

  // Handle navigation between views
  const handleNavigate = (direction) => {
    if (!isScheduleActive) return;
    
    clearTimeout(autoContinueTimer.current);
    setPaused(true);

    if (currentView === 'dynamic') {
      setCurrentView('media');
      navigateMedia(direction);
    } else if (currentView === 'media') {
      if (direction === 'next' && !media) {
        // If we're moving forward and there's no media, show dynamic view
        setCurrentView('dynamic');
      } else {
        // Otherwise, navigate through media
        navigateMedia(direction);
      }
    }
    
    setTimeout(() => setPaused(false), 200);
  };

  // Auto-advance timer effect
  useEffect(() => {
    if (paused || loading || !isScheduleActive) return;

    clearTimeout(autoContinueTimer.current);

    const duration = currentView === 'dynamic' ? 20000 : config.slideshow.defaultSlideDuration;
    
    autoContinueTimer.current = setTimeout(() => {
      handleNavigate('next');
    }, duration);

    return () => clearTimeout(autoContinueTimer.current);
  }, [currentView, media, paused, loading, isScheduleActive]);

  // Effect to switch to dynamic view when no media is available
  useEffect(() => {
    if (!media && currentView === 'media' && !loading && !paused) {
      setCurrentView('dynamic');
    }
  }, [media, currentView, loading, paused]);

  // Effect to clean up timers
  useEffect(() => {
    return () => clearTimeout(autoContinueTimer.current);
  }, []);

  // Stop all timers when schedule is inactive
  useEffect(() => {
    if (!isScheduleActive) {
      clearTimeout(autoContinueTimer.current);
      setPaused(true);
    } else {
      setPaused(false);
    }
  }, [isScheduleActive]);

  if (!isScheduleActive) {
    return <div className="w-screen h-screen bg-black" />;
  }

  if (!isServerConnected) {
    return <Loading key="loading" isServerConnecting={!isServerConnected} />;
  }
  
  if (loading) {
    return <Loading key="loading" isServerConnecting={false} />;
  }

  return (
    <div className="slideshow-container">
      <AnimatePresence mode="wait">
        {currentView === 'dynamic' ? (
          <motion.div
            key="dynamic-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <DynamicDailyView />
          </motion.div>
        ) : (
          <motion.div
            key="media-canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MediaCanvas media={media} />
          </motion.div>
        )}
      </AnimatePresence>

      <Controls
        show={showControls && !loading}
        onPrevious={() => handleNavigate('previous')}
        onNext={() => handleNavigate('next')}
        disabled={loading || !serverReady || paused}
      />

      <AnimatePresence>
        {(loading || !serverReady) && (
          <Loading isServerConnecting={!serverReady} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !loading && (
          <ErrorToast message={error} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Slideshow;