import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
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
  const [paused, setPaused] = useState(false);
  const autoContinueTimer = useRef(null);

  // Stop all timers and clear media when schedule is inactive
  useEffect(() => {
    if (!isScheduleActive) {
      clearTimeout(autoContinueTimer.current);
      setPaused(true);
    } else {
      setPaused(false);
    }
  }, [isScheduleActive]);

  const handleNavigate = (direction) => {
    if (!isScheduleActive) return;
    setPaused(true);
    navigateMedia(direction);
    setTimeout(() => setPaused(false), 200);
  };

  useEffect(() => {
    if (paused || !media || loading || !isScheduleActive) return;

    autoContinueTimer.current = setTimeout(() => {
      navigateMedia('next');
    }, config.slideshow.defaultSlideDuration);

    return () => clearTimeout(autoContinueTimer.current);
  }, [paused, media, loading, navigateMedia, isScheduleActive]);

  // Return black screen when schedule is inactive
  if (!isScheduleActive) {
    return <div className="w-screen h-screen bg-black" />;
  }

  if (!isServerConnected) {
    return <Loading key="loading" isServerConnecting={!isServerConnected} />;
  }
  
  if (loading) {
    return <Loading key="loading" isServerConnecting={false} />;
  }

  // Show dynamic daily view when no media is available and not in error state
  if (!media && !error) {
    return <DynamicDailyView />;
  }
  
  if (error) {
    return <ErrorToast message={error} />;
  }

  return (
    <div className="slideshow-container">
      <AnimatePresence>
        {media && !loading && (
          <MediaCanvas media={media} />
        )}
      </AnimatePresence>

      <Controls
        show={showControls && !loading && media}
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