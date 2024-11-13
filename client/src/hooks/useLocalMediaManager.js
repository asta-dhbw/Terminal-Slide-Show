/**
 * @typedef {Object} MediaManagerResult
 * @property {Object|null} media - Current media object or null if none available
 * @property {boolean} loading - Whether media is currently being loaded
 * @property {boolean} serverReady - Whether server is ready to serve media
 * @property {'connected'|'connecting'|'disconnected'|'error'} webSocketStatus - Current WebSocket connection status
 * @property {(direction: 'next'|'previous') => void} navigateMedia - Function to navigate between media items
 * @property {number} totalMedia - Total number of available media items
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useServerStatus } from './useServerStatus';
import { frontendConfig } from '../../../config/frontend.config';

/**
 * Custom hook for managing local media state with WebSocket and HTTP fallback
 * @param {boolean} [isScheduleActive=true] - Whether the media schedule is currently active
 * @returns {MediaManagerResult} Media management state and functions
 */
export const useLocalMediaManager = (isScheduleActive = true) => {
  /** @type {[Array<Object>, Function]} Media items array and setter */
  const [allMedia, setAllMedia] = useState([]);

  /** @type {[number, Function]} Current media index and setter */
  const [currentIndex, setCurrentIndex] = useState(0);

  /** @type {[boolean, Function]} Loading state and setter */
  const [loading, setLoading] = useState(true);

  /** @type {[string, Function]} WebSocket status and setter */
  const [webSocketStatus, setWebSocketStatus] = useState('disconnected');

  /** @type {[boolean, Function]} Server ready state and setter */
  const [serverReady, setServerReady] = useState(false);

  /** @type {boolean} Server connection status from useServerStatus hook */
  const isServerConnected = useServerStatus(isScheduleActive);

  // Use refs for WebSocket and reconnection timer
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  const MAX_RECONNECT_ATTEMPTS = frontendConfig.websocket.maxReconnectAttempts;
  const RECONNECT_INTERVAL = frontendConfig.websocket.reconnectInterval;

  /**
   * Fetches media list using HTTP as fallback when WebSocket is unavailable
   * @async
   * @returns {Promise<void>}
   */
  const fetchMediaFallback = useCallback(async () => {
    try {
      const response = await fetch('/api/all-media');
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setAllMedia(data);
      setLoading(false);
    } catch (err) {
      console.warn('Fallback media fetch failed:', err);
    }
  }, []);

    /**
   * Establishes WebSocket connection with reconnection logic
   * @returns {void}
   */
  const connect = useCallback(() => {
    // Only attempt connection if server is connected and schedule is active
    if (!isScheduleActive || !isServerConnected || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    console.log('Attempting WebSocket connection...');
    setWebSocketStatus('connecting');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWebSocketStatus('connected');
      setServerReady(true);
      reconnectAttemptsRef.current = 0;

      // Clear any pending reconnect timers
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data.type);

        switch (data.type) {
          case 'mediaList':
          case 'mediaUpdate':
            setAllMedia(data.media);
            // Only reset index if current is invalid
            setCurrentIndex(prev => prev >= data.media.length ? 0 : prev);
            setLoading(false);
            break;
        }
      } catch (err) {
        console.warn('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.warn('WebSocket error:', error);
      setWebSocketStatus('error');
      // Don't set serverReady to false, as we can still use HTTP fallback
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setWebSocketStatus('disconnected');
      wsRef.current = null;

      // Fetch media via HTTP while disconnected
      fetchMediaFallback();

      // Attempt to reconnect if still active
      if (isScheduleActive && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        console.log(`Will attempt to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL);
      }
    };

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    ws.addEventListener('close', () => clearInterval(pingInterval));
  }, [isScheduleActive, isServerConnected, fetchMediaFallback]);

     /**
   * Navigates between media items
   * @param {'next'|'previous'} direction - Navigation direction
   * @returns {void}
   */
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

    /**
   * Gets current media item
   * @returns {Object|null} Current media item or null if none available
   */
  const getCurrentMedia = useCallback(() => {
    return allMedia[currentIndex] || null;
  }, [allMedia, currentIndex]);


   // Initial setup and cleanup
   useEffect(() => {
    if (isScheduleActive && isServerConnected) {
      // Initial media fetch via HTTP
      fetchMediaFallback();
      // Then try WebSocket connection
      connect();
    } else {
      // Close WebSocket when server disconnects or schedule becomes inactive
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isScheduleActive, isServerConnected, connect, fetchMediaFallback]);


  // Poll for updates when WebSocket is down
  useEffect(() => {
    if (!isScheduleActive || webSocketStatus === 'connected') return;

    const pollInterval = setInterval(fetchMediaFallback, 10000);
    return () => clearInterval(pollInterval);
  }, [isScheduleActive, webSocketStatus, fetchMediaFallback]);

  return {
    media: getCurrentMedia(),
    loading,
    serverReady: serverReady || allMedia.length > 0,
    webSocketStatus,
    navigateMedia,
    totalMedia: allMedia.length
  };
};