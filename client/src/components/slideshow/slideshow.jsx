import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocalMediaManager } from '../../hooks/useLocalMediaManager';
import { useControlsVisibility } from '../../hooks/useControlsVisibility';
import { useServerStatus } from '../../hooks/useServerStatus';
import { useSchedule } from '../../hooks/useSchedule';
import { isRaspberryPi } from '../../utils/deviceDetection';
import MediaCanvas from './mediaCanvas';
import Controls from './controls';
import Loading from '../loading';
import ErrorToast from '../errorToast';
import DynamicDailyView from '../dynamic_daily_view/dynamicDailyView';
import { frontendConfig } from '../../../../config/frontend.config.js';
import ConnectionToast from '../connectionToast.jsx';

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
  const { media, loading, error, serverReady, navigateMedia } = useLocalMediaManager(isScheduleActive);
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

  const handleNavigate = useCallback((direction) => {
    if (!isScheduleActive) return;
    setPaused(true);
    navigateMedia(direction);
    setTimeout(() => setPaused(false), 200);
  }, [isScheduleActive, navigateMedia]);

  // Auto-advance timer effect
  useEffect(() => {
    if (paused || !media || loading || !isScheduleActive) return;

    const duration = media.duration || frontendConfig.slideshow.defaultSlideDuration;

    autoContinueTimer.current = setTimeout(() => {
      handleNavigate('next');
    }, duration);

    return () => clearTimeout(autoContinueTimer.current);
  }, [paused, media, loading, isScheduleActive, handleNavigate]);

  // Only show loading states if schedule is active and no cached media
  if (!isServerConnected && !media && isScheduleActive) {
    return <Loading key="loading" isServerConnecting={!isServerConnected} />;
  }

  if (loading && !media && isScheduleActive) {
    return <Loading key="loading" isServerConnecting={false} />;
  }

  return (
    <div className="slideshow-container">
      {/* Main content wrapper with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        {!loading && (media ? (
          <>
            {media.isDynamicView ? (
              <DynamicDailyView key="dynamic-view" />
            ) : (
              <MediaCanvas key="media" media={media} />
            )}
            {!isServerConnected && <ConnectionToast />}
          </>
        ) : isScheduleActive ? (
          <DynamicDailyView key="dynamic-view" />
        ) : null)}
      </AnimatePresence>

      {/* Navigation controls */}
      {media && (
        <Controls
          show={showControls}
          onPrevious={() => handleNavigate('previous')}
          onNext={() => handleNavigate('next')}
          disabled={loading || !serverReady || paused}
        />
      )}

      {/* Error toast */}
      <AnimatePresence>
        {error && !loading && isScheduleActive && !media?.isDynamicView && (
          <ErrorToast message={error} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Slideshow;