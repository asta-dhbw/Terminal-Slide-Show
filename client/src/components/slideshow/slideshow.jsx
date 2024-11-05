import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMediaLoader } from '../../hooks/useMediaLoader';
import { useControlsVisibility } from '../../hooks/useControlsVisibility';
import { useServerStatus } from '../../hooks/useServerStatus';
import { useSchedule } from '../../hooks/useSchedule';
import { isRaspberryPi } from '../../utils/deviceDetection';
import MediaCanvas from './mediaCanvas';
import Controls from './controls';
import Loading from '../loading';
import ErrorToast from '../errorToast';
import DynamicDailyView from '../dynamic_daily_view/dynamicDailyView';
import { config } from '../../../../config/config';

const Slideshow = () => {
  const scheduleEnabled = isRaspberryPi();
  const isScheduleActive = scheduleEnabled ? useSchedule() : true;
  const { media, loading, error, serverReady, navigateMedia } = useMediaLoader(isScheduleActive);
  const showControls = useControlsVisibility();
  const isServerConnected = useServerStatus(isScheduleActive);
  const [paused, setPaused] = useState(false);
  const autoContinueTimer = useRef(null);
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('Slideshow State:', {
      hasMedia: !!media,
      loading,
      error,
      serverReady,
      isScheduleActive,
      isServerConnected,
      paused
    });
  }, [media, loading, error, serverReady, isScheduleActive, isServerConnected, paused]);

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
    if (paused || !media || loading || !isScheduleActive) {
      clearTimeout(autoContinueTimer.current);
      return;
    }

    autoContinueTimer.current = setTimeout(() => {
      navigateMedia('next');
    }, config.slideshow.defaultSlideDuration);

    return () => clearTimeout(autoContinueTimer.current);
  }, [paused, media, loading, navigateMedia, isScheduleActive]);

  if (!isScheduleActive) {
    return <div className="w-screen h-screen bg-black" />;
  }

  return (
    <div className="slideshow-container">
      {media ? (
        <AnimatePresence mode="wait">
          <div key="media-container" className="relative w-full h-full">
            <MediaCanvas media={media} />
            {showControls && (
              <Controls
                show={true}
                onPrevious={() => handleNavigate('previous')}
                onNext={() => handleNavigate('next')}
                disabled={!serverReady || paused}
              />
            )}
          </div>
        </AnimatePresence>
      ) : (
        <DynamicDailyView />
      )}
    </div>
  );
};

export default Slideshow;