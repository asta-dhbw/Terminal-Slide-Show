import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMediaLoader } from '../hooks/useMediaLoader';
import { useControlsVisibility } from '../hooks/useControlsVisibility';
import MediaCanvas from './mediaCanvas';
import Controls from './controls';
import Loading from './loading';
import ErrorToast from './errorToast';

const AUTO_CONTINUE_INTERVAL = 5000; // 5 seconds

const Slideshow = () => {
  const { media, loading, error, serverReady, navigateMedia } = useMediaLoader();
  const showControls = useControlsVisibility();
  const [paused, setPaused] = useState(false);
  const autoContinueTimer = useRef(null);

  const handleNavigate = (direction) => {
    setPaused(true);
    navigateMedia(direction);
    setTimeout(() => setPaused(false), 1000); // Pause for the duration of the transition
  };

  useEffect(() => {
    if (paused || !media || loading) return;

    autoContinueTimer.current = setTimeout(() => {
      navigateMedia('next');
    }, AUTO_CONTINUE_INTERVAL);

    return () => clearTimeout(autoContinueTimer.current);
  }, [paused, media, loading, navigateMedia]);

  useEffect(() => {
    if (paused) {
      clearTimeout(autoContinueTimer.current);
    }
  }, [paused]);

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