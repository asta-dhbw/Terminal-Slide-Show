import { useState, useCallback, useEffect } from 'react';
import { config } from '../../../config/config';

export const useMediaLoader = (isScheduleActive = true) => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false since we won't load if schedule is inactive
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [lastModified, setLastModified] = useState(null);
  const [serverReconnected, setServerReconnected] = useState(false);
  const [initialLoadStartTime, setInitialLoadStartTime] = useState(null);

  // Reset all state when schedule becomes inactive
  useEffect(() => {
    if (!isScheduleActive) {
      setMedia(null);
      setLoading(false);
      setError(null);
      setServerReady(false);
      setLastModified(null);
      setServerReconnected(false);
      setInitialLoadStartTime(null);
    }
  }, [isScheduleActive]);

  const checkServer = useCallback(async () => {
    // Don't check server if schedule is inactive
    if (!isScheduleActive) {
      setServerReady(false);
      return false;
    }

    try {
      const response = await fetch('/api/health');
      const isReady = response.ok;
      
      if (!serverReady && isReady) {
        setServerReconnected(true);
        setLoading(true);
        setInitialLoadStartTime(Date.now());
      }
      
      setServerReady(isReady);
      return isReady;
    } catch {
      setServerReady(false);
      return false;
    }
  }, [serverReady, isScheduleActive]);

  const loadMedia = useCallback(async () => {
    // Don't load media if schedule is inactive
    if (!serverReady || !isScheduleActive) return;
    
    try {
      const response = await fetch('/api/current-media');
      const data = await response.json();
      
      if (data.error) {
        setError(null);
        setMedia(null);
        setLoading(false);
        return;
      }
  
      if (serverReconnected || data.lastModified !== lastModified) {
        setLastModified(data.lastModified);
        setMedia(data);
        setError(null);
        
        if (serverReconnected && initialLoadStartTime) {
          const elapsed = Date.now() - initialLoadStartTime;
          const remainingTime = Math.max(0, config.polling.initLoadDuration - elapsed);
          
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
  }, [serverReady, lastModified, serverReconnected, initialLoadStartTime, isScheduleActive]);

  const navigateMedia = useCallback(async (direction) => {
    // Don't navigate if schedule is inactive
    if (!serverReady || !isScheduleActive) return;
    
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
  }, [serverReady, isScheduleActive]);

  useEffect(() => {
    let serverPollInterval;
    let mediaPollInterval;

    // Only start polling if schedule is active
    if (isScheduleActive) {
      const init = async () => {
        const isReady = await checkServer();
        if (isReady) {
          await loadMedia();
        }
      };
      init();

      serverPollInterval = setInterval(checkServer, config.polling.mediaLoaderInterval);
      mediaPollInterval = setInterval(() => {
        if (serverReady) {
          loadMedia();
        }
      }, config.polling.mediaLoaderInterval);
    }

    return () => {
      clearInterval(serverPollInterval);
      clearInterval(mediaPollInterval);
    };
  }, [checkServer, loadMedia, serverReady, isScheduleActive]);

  return {
    media,
    loading,
    error,
    serverReady,
    navigateMedia
  };
};

export default useMediaLoader;