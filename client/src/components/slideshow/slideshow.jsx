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

/**
 * @component Slideshow
 * @description A media slideshow component that handles automatic playback, navigation,
 * loading states, and error handling. Only active when schedule is enabled.
 * 
 * @returns {JSX.Element} The rendered slideshow component
 */
const Slideshow = () => {
  const scheduleEnabled = isRaspberryPi();
  const isScheduleActive = scheduleEnabled ? useSchedule() : true;

  // Custom hooks for managing media, controls, and server state
  const { media, loading, error, serverReady, navigateMedia } = useMediaLoader(isScheduleActive);
  const showControls = useControlsVisibility();
  const isServerConnected = useServerStatus(isScheduleActive);

  // State for managing playback
  const [paused, setPaused] = useState(false);
  const autoContinueTimer = useRef(null);

  // Cleanup effect when schedule becomes inactive
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

  // Auto-advance timer effect
  useEffect(() => {
    if (paused || !media || loading || !isScheduleActive) return;

    autoContinueTimer.current = setTimeout(() => {
      handleNavigate('next');
    }, config.slideshow.defaultSlideDuration);

    return () => clearTimeout(autoContinueTimer.current);
  }, [paused, media, loading, isScheduleActive]);

  // Return black screen when schedule is inactive
  if (!isScheduleActive) {
    return <div className="w-screen h-screen bg-black" />;
  }

  // Only show loading states if schedule is active
  if (!isServerConnected && isScheduleActive) {
    return <Loading key="loading" isServerConnecting={!isServerConnected} />;
  }

  if (loading && isScheduleActive) {
    return <Loading key="loading" isServerConnecting={false} />;
  }

  return (
    <div className="slideshow-container">
      <AnimatePresence mode="wait">
        {!loading && media && (media.isDynamicView ? (
          <DynamicDailyView key="dynamic-view" />
        ) : (
          <MediaCanvas key="media" media={media} />
        ))}
      </AnimatePresence>

      {/* Navigation controls - only show when media is available */}
      {media && (
        <Controls
          show={showControls}
          onPrevious={() => handleNavigate('previous')}
          onNext={() => handleNavigate('next')}
          disabled={loading || !serverReady || paused}
        />
      )}

      {/* Loading overlay */}
      <AnimatePresence>
        {(loading || !serverReady) && isScheduleActive && (
          <Loading isServerConnecting={!serverReady} />
        )}
      </AnimatePresence>

      {/* Only show error toast when not in dynamic view */}
      <AnimatePresence>
        {error && !loading && isScheduleActive && !media?.isDynamicView && (
          <ErrorToast message={error} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Slideshow;