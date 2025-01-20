import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import '../../styles/controls.css';

/**
 * Controls component for navigation with buttons and swipe gestures
 * @component
 * @param {Object} props
 * @param {boolean} props.show - Controls visibility of navigation buttons
 * @param {Function} props.onPrevious - Callback for previous navigation action
 * @param {Function} props.onNext - Callback for next navigation action
 * @param {boolean} props.disabled - Disables navigation controls when true
 * @returns {JSX.Element} Navigation controls with animation
 */
const Controls = ({ show, onPrevious, onNext, disabled }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [lastActionTime, setLastActionTime] = useState(0);
  const debounceDelay = 500; // Minimum time between actions in ms

  /**
   * Handles previous navigation with debouncing and loading state
   * @function
   */
  const handlePrevious = useCallback(async () => {
    const now = Date.now();
    if (disabled || isLoading || now - lastActionTime < debounceDelay) return;
    setIsLoading(true);
    setLastActionTime(now);
    await onPrevious();
    setIsLoading(false);
  }, [disabled, isLoading, lastActionTime, onPrevious]);

  /**
   * Handles next navigation with debouncing and loading state
   * @function
   */
  const handleNext = useCallback(async () => {
    const now = Date.now();
    if (disabled || isLoading || now - lastActionTime < debounceDelay) return;
    setIsLoading(true);
    setLastActionTime(now);
    await onNext();
    setIsLoading(false);
  }, [disabled, isLoading, lastActionTime, onNext]);

  // Configure swipe gesture handlers
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
            {/* Previous button with slide animation */}
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

            {/* Next button with slide animation */}
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