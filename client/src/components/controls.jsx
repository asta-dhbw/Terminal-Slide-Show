import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import '../styles/controls.css';

const Controls = ({ show, onPrevious, onNext, disabled }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);
  const debounceDelay = 500; // Adjust the delay as needed

  const handlePrevious = useCallback(async () => {
    const now = Date.now();
    if (disabled || isLoading || now - lastActionTime < debounceDelay) return;
    setIsLoading(true);
    setLastActionTime(now);
    await onPrevious();
    setIsLoading(false);
  }, [disabled, isLoading, lastActionTime, onPrevious]);

  const handleNext = useCallback(async () => {
    const now = Date.now();
    if (disabled || isLoading || now - lastActionTime < debounceDelay) return;
    setIsLoading(true);
    setLastActionTime(now);
    await onNext();
    setIsLoading(false);
  }, [disabled, isLoading, lastActionTime, onNext]);

  const handlers = useSwipeable({
    onSwipedLeft: () => !disabled && handleNext(),
    onSwipedRight: () => !disabled && handlePrevious(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <div {...handlers} className="swipe-container">
      <AnimatePresence>
        {show && (
          <>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onClick={handlePrevious}
              disabled={disabled || isLoading}
              className="nav-button nav-button-left"
            >
              <ChevronLeft className="w-8 h-8" />
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onClick={handleNext}
              disabled={disabled || isLoading}
              className="nav-button nav-button-right"
            >
              <ChevronRight className="w-8 h-8" />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Controls;