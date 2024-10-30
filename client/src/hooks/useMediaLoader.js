import { useState, useCallback, useEffect } from 'react';
import { config } from '../../../config/config';

export const useMediaLoader = () => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [lastModified, setLastModified] = useState(null);
  const [serverReconnected, setServerReconnected] = useState(false);
  const [initialLoadStartTime, setInitialLoadStartTime] = useState(null);

  const checkServer = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const isReady = response.ok;
      
      // Detect server reconnection
      if (!serverReady && isReady) {
        setServerReconnected(true);
        setLoading(true);
        setInitialLoadStartTime(Date.now()); // Start timing for initial load
      }
      
      setServerReady(isReady);
      return isReady;
    } catch {
      setServerReady(false);
      return false;
    }
  }, [serverReady]);

  const loadMedia = useCallback(async () => {
    if (!serverReady) return;
    
    try {
      const response = await fetch('/api/current-media');
      const data = await response.json();
      
      if (data.error) {
        setError('No media available');
        setMedia(null);
        return;
      }

      // Force media update on server reconnection
      if (serverReconnected || data.lastModified !== lastModified) {
        setLastModified(data.lastModified);
        setMedia(data);
        setError(null);
        
        // Handle initial loading duration
        if (serverReconnected && initialLoadStartTime) {
          const elapsed = Date.now() - initialLoadStartTime;
          const remainingTime = Math.max(0, config.polling.initLoadDuration - elapsed);
          
          // Only apply minimum duration for initial load after reconnection
          setTimeout(() => {
            setLoading(false);
            setServerReconnected(false);
            setInitialLoadStartTime(null);
          }, remainingTime);
        } else {
          setLoading(false);
          setServerReconnected(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load media');
      setMedia(null);
      setLoading(false);
    }
  }, [serverReady, lastModified, serverReconnected, initialLoadStartTime]);

  const navigateMedia = useCallback(async (direction) => {
    if (!serverReady) return;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/${direction}-media`);
      const data = await response.json();
      
      if (data.error) {
        setError('No media available');
        setMedia(null);
        return;
      }

      setLastModified(data.lastModified);
      setMedia(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load ${direction} media`);
      setMedia(null);
    } finally {
      setLoading(false);
    }
  }, [serverReady]);

  useEffect(() => {
    const init = async () => {
      const isReady = await checkServer();
      if (isReady) {
        await loadMedia();
      }
    };
    init();

    const serverPollInterval = setInterval(checkServer, config.polling.mediaLoaderInterval);
    const mediaPollInterval = setInterval(() => {
      if (serverReady) {
        loadMedia();
      }
    }, config.polling.mediaLoaderInterval);

    return () => {
      clearInterval(serverPollInterval);
      clearInterval(mediaPollInterval);
    };
  }, [checkServer, loadMedia, serverReady]);

  return {
    media,
    loading,
    error,
    serverReady,
    navigateMedia
  };
};

export default useMediaLoader;