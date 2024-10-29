import { useState, useCallback, useEffect } from 'react';

const POLL_INTERVAL = 5000;

export const useMediaLoader = () => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [lastModified, setLastModified] = useState(null);

  const checkServer = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const isReady = response.ok;
      setServerReady(isReady);
      return isReady;
    } catch {
      setServerReady(false);
      return false;
    }
  }, []);

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

      // Only update if the media has changed
      if (data.lastModified !== lastModified) {
        setLastModified(data.lastModified);
        setMedia(data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load media');
      setMedia(null);
    } finally {
      setLoading(false);
    }
  }, [serverReady, lastModified]);

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
      await checkServer();
      await loadMedia();
    };
    init();

    const pollInterval = setInterval(() => {
      loadMedia();
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [checkServer, loadMedia]);

  return {
    media,
    loading,
    error,
    serverReady,
    navigateMedia
  };
};