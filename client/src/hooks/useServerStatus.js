import { useState, useEffect } from 'react';
import { config } from '../../../config/config';

export const useServerStatus = (pollingInterval = config.polling.serverStatusInterval) => {
  const [isServerConnected, setIsServerConnected] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/api/server-status');
        if (response.ok) {
          setIsServerConnected(true);
        } else {
          setIsServerConnected(false);
        }
      } catch (error) {
        setIsServerConnected(false);
      }
    };

    checkServerStatus();
    const intervalId = setInterval(checkServerStatus, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval]);

  return isServerConnected;
};

export default useServerStatus;