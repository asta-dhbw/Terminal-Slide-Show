import React from 'react';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Slideshow = () => {
  const [media, setMedia] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [serverReady, setServerReady] = React.useState(false);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [showControls, setShowControls] = React.useState(true);

  // Handle image load and calculate optimal size
  const handleImageLoad = React.useCallback(() => {
    const image = document.getElementById('media');
    if (image) {
      image.style.maxWidth = '100vw';
      image.style.maxHeight = '100vh';
    }
  }, []);

  // Window resize handler
  React.useEffect(() => {
    window.addEventListener('resize', handleImageLoad);
    return () => window.removeEventListener('resize', handleImageLoad);
  }, [handleImageLoad]);

  // Controls visibility
  React.useEffect(() => {
    let timeout;
    const handleMovement = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMovement);
    window.addEventListener('touchstart', handleMovement);

    return () => {
      window.removeEventListener('mousemove', handleMovement);
      window.removeEventListener('touchstart', handleMovement);
      clearTimeout(timeout);
    };
  }, []);

  // Prevent scrolling
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Server and media loading logic
  const checkServer = React.useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setServerReady(true);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  const waitForServer = React.useCallback(async () => {
    while (!(await checkServer())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [checkServer]);

  const loadMedia = React.useCallback(async () => {
    if (!serverReady) return;
    setLoading(true);
    try {
      const response = await fetch('/api/current-media');
      const data = await response.json();
      
      if (data.error) {
        setError('No media available');
        setMedia(null);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMedia(data);
      setError(null);
    } catch (error) {
      setError('Failed to load media');
      setMedia(null);
    } finally {
      setInitialLoad(false);
      setLoading(false);
    }
  }, [serverReady]);

  const handleNext = async () => {
    if (isTransitioning || !serverReady) return;
    
    setIsTransitioning(true);
    setLoading(true);
    try {
      const response = await fetch('/api/next-media');
      const data = await response.json();
      
      if (data.error) {
        setError('No media available');
        setMedia(null);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMedia(data);
      setError(null);
    } catch (error) {
      setError('Failed to load next media');
      setMedia(null);
    } finally {
      setIsTransitioning(false);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const init = async () => {
      await waitForServer();
      await loadMedia();
    };
    init();
  }, [waitForServer, loadMedia]);

  React.useEffect(() => {
    if (!serverReady) return;

    const interval = setInterval(() => {
      loadMedia();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [serverReady, loadMedia]);

  const isVideo = media?.name.toLowerCase().endsWith('.mp4');

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black">
      <AnimatePresence>
        {media && !loading && (
          <motion.div
            key={media.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
             {isVideo ? (
              <video
                id="media"
                src={`/media/${media.name}`}
                className="object-contain"
                style={{ maxWidth: '100vw', maxHeight: '100vh' }}
                autoPlay
                muted
                onEnded={handleNext}
              />
            ) : (
              <img
                id="media"
                src={`/media/${media.name}`}
                alt={media.name}
                className="object-contain"
                onLoad={handleImageLoad}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Navigation Controls */}
      <AnimatePresence>
        {media && !loading && showControls && (
          <>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => handlePrevious()}
              disabled={loading || isTransitioning || !serverReady}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-50"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => handleNext()}
              disabled={loading || isTransitioning || !serverReady}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-50"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Loading States */}
      <AnimatePresence>
        {(loading || !serverReady || initialLoad) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black z-50"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 0, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center"
            >
              {!serverReady ? (
                <Server className="icon" />
              ) : (
                <Loader2 className="icon animate-spin" />
              )}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/80 text-2xl font-light mt-6"
            >
              {!serverReady ? 'Connecting to server...' : 'Loading media...'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="icon" />
              <p className="text-white/90 text-base font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Slideshow;