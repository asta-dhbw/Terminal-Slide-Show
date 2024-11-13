import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { frontendConfig } from '../../../config/frontend.config.js';

/**
 * Custom hook for loading and managing media content with server connectivity
 * @param {boolean} isScheduleActive - Controls whether media loading is active
 * @returns {Object} Media loader state and controls
 * 
 * State management for:
 * - Media content loading
 * - Server connectivity
 * - Error handling
 * - Client identification
 * - Navigation between media items
 */
export const useMediaLoader = (isScheduleActive = true) => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [lastModified, setLastModified] = useState(null);
  const [serverReconnected, setServerReconnected] = useState(false);
  const [initialLoadStartTime, setInitialLoadStartTime] = useState(null);
  const [clientId] = useState(() => {
    return uuidv4(); // storedId ||
  });

  useEffect(() => {
    localStorage.setItem('clientId', clientId);
  }, [clientId]);

  // Reset all state when schedule becomes inactive o5 loading media is null ( needed for reinitialization)
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

    /**
   * Utility function for making authenticated requests
   * @param {string} url - API endpoint URL
   * @returns {Promise<Response>} Fetch response
   */
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
          const remainingTime = Math.max(0, frontendConfig.slideshow.initLoadDuration - elapsed);

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

      serverPollInterval = setInterval(checkServer, frontendConfig.polling.mediaLoaderInterval);
      mediaPollInterval = setInterval(() => {
        if (serverReady) {
          loadMedia();
        }
      }, frontendConfig.polling.mediaLoaderInterval);
    }

    return () => {
      clearInterval(serverPollInterval);
      clearInterval(mediaPollInterval);
    };
  }, [checkServer, loadMedia, serverReady, isScheduleActive]);

  return {
    media,        // Current media content
    loading,      // Loading status flag
    error,        // Error message if any
    serverReady,  // Server connection status
    navigateMedia,// Function to navigate between media
    clientId      // Unique client identifier
  };
};

export default useMediaLoader;