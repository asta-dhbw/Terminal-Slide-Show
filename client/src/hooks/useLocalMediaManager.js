
import { useState, useCallback, useEffect } from 'react';
import { frontendConfig } from '../../../config/frontend.config.js';

export const useLocalMediaManager = (isScheduleActive = true) => {
  const [allMedia, setAllMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);

  const fetchAllMedia = useCallback(async () => {
    if (!isScheduleActive) return;
    
    try {
      const response = await fetch('/api/all-media');
      if (!response.ok) throw new Error('Failed to fetch media');
      
      const data = await response.json();
      setAllMedia(data);
      setServerReady(true);
      setError(null);
    } catch (err) {
      setError('Failed to load media');
      setServerReady(false);
    } finally {
      setLoading(false);
    }
  }, [isScheduleActive]);

  // Poll for media updates
  useEffect(() => {
    if (!isScheduleActive) {
      setAllMedia([]);
      setLoading(false);
      return;
    }

    fetchAllMedia();
    const interval = setInterval(fetchAllMedia, frontendConfig.polling.mediaLoaderInterval);
    
    return () => clearInterval(interval);
  }, [fetchAllMedia, isScheduleActive]);

  const getCurrentMedia = useCallback(() => {
    return allMedia[currentIndex] || null;
  }, [allMedia, currentIndex]);

  const navigateMedia = useCallback((direction) => {
    if (allMedia.length === 0) return null;
    
    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % allMedia.length);
    } else if (direction === 'previous') {
      setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    }
    
    return getCurrentMedia();
  }, [allMedia, getCurrentMedia]);

  return {
    media: getCurrentMedia(),
    loading,
    error,
    serverReady,
    navigateMedia,
    totalMedia: allMedia.length
  };
};