import React from 'react';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ModernSlideshow = () => {
  const [media, setMedia] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [serverReady, setServerReady] = React.useState(false);
  const [initialLoad, setInitialLoad] = React.useState(true);

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
    <div className="fixed inset-0 w-screen h-screen bg-black">
      {/* Media Display Layer */}
      <AnimatePresence mode="wait">
        {media && !loading && (
          <motion.div
            key={media.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            {isVideo ? (
              <video
                key={media.name}
                src={`/media/${media.name}`}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                muted
                controls={false}
                onEnded={handleNext}
              />
            ) : (
              <img
                src={`/media/${media.name}`}
                alt={media.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading States */}
      <AnimatePresence>
        {(loading || !serverReady || initialLoad) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50"
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
              className="relative"
            >
              {!serverReady ? (
                <Server className="w-16 h-16 text-white" />
              ) : (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              )}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/80 text-xl font-light mt-6"
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
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-white/90 text-base font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-40" />
      
      <div className="absolute inset-x-8 bottom-8 flex items-center justify-between z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleNext()}
          disabled={loading || isTransitioning || !serverReady}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleNext()}
          disabled={loading || isTransitioning || !serverReady}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </motion.button>
      </div>
    </div>
  );
};

export default ModernSlideshow;