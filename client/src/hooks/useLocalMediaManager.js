import { useState, useCallback, useEffect } from 'react';
import { frontendConfig } from '../../../config/frontend.config.js';

export const useLocalMediaManager = (isScheduleActive = true) => {
  const [allMedia, setAllMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverReady, setServerReady] = useState(false);

  // Simple fetch function to get all media
  const fetchMediaList = useCallback(async () => {
    if (!isScheduleActive) return;
    
    try {
      const response = await fetch('/api/all-media');
      if (!response.ok) throw new Error('Failed to fetch media');
      
      const newMedia = await response.json();
      
      // Only update if the media list has changed
      const currentMediaIds = allMedia.map(m => m.name).sort().join(',');
      const newMediaIds = newMedia.map(m => m.name).sort().join(',');
      
      if (currentMediaIds !== newMediaIds) {
        setAllMedia(newMedia);
        // Reset to first item if current index is invalid
        if (currentIndex >= newMedia.length) {
          setCurrentIndex(0);
        }
      }
      
      setServerReady(true);
      setError(null);
    } catch (err) {
      setError('Failed to load media');
      setServerReady(false);
    } finally {
      setLoading(false);
    }
  }, [isScheduleActive, allMedia, currentIndex]);

  // Set up polling interval when active
  useEffect(() => {
    if (!isScheduleActive) {
      setAllMedia([]);
      setCurrentIndex(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchMediaList();

    // Poll for updates
    const interval = setInterval(fetchMediaList, frontendConfig.polling.mediaLoaderInterval);
    
    return () => clearInterval(interval);
  }, [fetchMediaList, isScheduleActive]);

  // Navigation functions
  const navigateMedia = useCallback((direction) => {
    if (allMedia.length === 0) return null;
    
    setCurrentIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % allMedia.length;
      } else if (direction === 'previous') {
        return (prev - 1 + allMedia.length) % allMedia.length;
      }
      return prev;
    });
  }, [allMedia.length]);

  // Get current media
  const getCurrentMedia = useCallback(() => {
    return allMedia[currentIndex] || null;
  }, [allMedia, currentIndex]);

  return {
    media: getCurrentMedia(),
    loading,
    error,
    serverReady,
    navigateMedia,
    totalMedia: allMedia.length
  };
};