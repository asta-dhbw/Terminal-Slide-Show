import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config/config';

export const useMediaLoader = (isScheduleActive = true) => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [lastModified, setLastModified] = useState(null);
  const [serverReconnected, setServerReconnected] = useState(false);
  const [initialLoadStartTime, setInitialLoadStartTime] = useState(null);
  const [clientId] = useState(() => {
    //if only one use per browser is wanted:  const storedId = localStorage.getItem('clientId');
    // and combine this settin original instances detect other tabs via storage
    return uuidv4(); // storedId ||
  });

  // Store clientId in localStorage
  useEffect(() => {
    localStorage.setItem('clientId', clientId);
  }, [clientId]);

  // Reset all state when schedule becomes inactive o5r loading media is null ( needed for reinitialization)
  useEffect(() => {
    if (!isScheduleActive || !media) {
      setMedia(null);
      setLoading(false);
      setError(null);
      setServerReady(false);
      setLastModified(null);
      setServerReconnected(false);
      setInitialLoadStartTime(null);
    }
  }, [isScheduleActive, media]);

  const fetchWithClientId = useCallback(async (url) => {
    const response = await fetch(url, {
      headers: {
        'X-Client-Id': clientId
      }
    });
    return response;
  }, [clientId]);

  const checkServer = useCallback(async () => {
    if (!isScheduleActive) {
      setServerReady(false);
      return false;
    }

    try {
      const response = await fetchWithClientId('/api/server-status');
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
  }, [serverReady, isScheduleActive, fetchWithClientId]);

  const loadMedia = useCallback(async () => {
    if (!serverReady || !isScheduleActive) return;

    try {
      const response = await fetchWithClientId('/api/current-media');
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
  }, [serverReady, lastModified, serverReconnected, initialLoadStartTime, isScheduleActive, fetchWithClientId]);

  const navigateMedia = useCallback(async (direction) => {
    if (!serverReady || !isScheduleActive) return;

    try {
      const response = await fetchWithClientId(`/api/${direction}-media`);
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
  }, [serverReady, isScheduleActive, fetchWithClientId]);

  useEffect(() => {
    let serverPollInterval;
    let mediaPollInterval;

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
    navigateMedia,
    clientId
  };
};

export default useMediaLoader;