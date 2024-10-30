// src/hooks/useSchedule.js
import { useState, useEffect } from 'react';
import { config } from '../../../config/config';

export const useSchedule = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!config.schedule.enabled) {
      setIsActive(true);
      return;
    }

    const checkSchedule = () => {
      const now = new Date();
      const currentDay = now.getDay();
      
      // Check if current day is in schedule
      if (!config.schedule.days.includes(currentDay)) {
        setIsActive(false);
        return;
      }

      // Parse schedule times
      const [onHour, onMinute] = config.schedule.onTime.split(':').map(Number);
      const [offHour, offMinute] = config.schedule.offTime.split(':').map(Number);
      
      // Convert current time to minutes for easier comparison
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const onTimeMinutes = onHour * 60 + onMinute;
      const offTimeMinutes = offHour * 60 + offMinute;

      // Handle cases where off time is on the next day
      if (offTimeMinutes < onTimeMinutes) {
        setIsActive(
          currentMinutes >= onTimeMinutes || 
          currentMinutes < offTimeMinutes
        );
      } else {
        setIsActive(
          currentMinutes >= onTimeMinutes && 
          currentMinutes < offTimeMinutes
        );
      }
    };

    // Initial check
    checkSchedule();

    // Check every minute
    const interval = setInterval(checkSchedule, 60000);

    return () => clearInterval(interval);
  }, []);

  return isActive;
};