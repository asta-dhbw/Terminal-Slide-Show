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
  const [clientId] = useState(() => uuidv4());

  // Store clientId in localStorage
  useEffect(() => {
    localStorage.setItem('clientId', clientId);
  }, [clientId]);

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
      setLoading(true); // Set loading state for each attempt
      const response = await fetchWithClientId('/api/current-media');
      const data = await response.json();

      if (data.error) {
        setError(null);
        setMedia(null);
      } else {
        // Reset error state and update media
        setError(null);
        setMedia(data);
        setLastModified(data.lastModified);
      }
    } catch (err) {
      setError('Failed to load media');
      setMedia(null);
    } finally {
      setLoading(false);
      setServerReconnected(false);
      setInitialLoadStartTime(null);
    }
  }, [serverReady, isScheduleActive, fetchWithClientId]);

  const navigateMedia = useCallback(async (direction) => {
    if (!serverReady || !isScheduleActive) return;

    try {
      setLoading(true);
      const response = await fetchWithClientId(`/api/${direction}-media`);
      const data = await response.json();

      if (data.error) {
        setError('No media available');
        setMedia(null);
      } else {
        setError(null);
        setMedia(data);
        setLastModified(data.lastModified);
      }
    } catch (err) {
      setError(`Failed to load ${direction} media`);
      setMedia(null);
    } finally {
      setLoading(false);
    }
  }, [serverReady, isScheduleActive, fetchWithClientId]);

  // Set up polling intervals
  useEffect(() => {
    if (!isScheduleActive) {
      setMedia(null);
      setLoading(false);
      setError(null);
      setServerReady(false);
      setLastModified(null);
      setServerReconnected(false);
      setInitialLoadStartTime(null);
      return;
    }

    // Initial check
    const init = async () => {
      const isReady = await checkServer();
      if (isReady) {
        await loadMedia();
      }
    };
    init();

    // Set up polling intervals
    const serverInterval = setInterval(checkServer, config.polling.serverStatusInterval);
    const mediaInterval = setInterval(() => {
      if (serverReady) {
        loadMedia();
      }
    }, config.polling.mediaLoaderInterval);

    return () => {
      clearInterval(serverInterval);
      clearInterval(mediaInterval);
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