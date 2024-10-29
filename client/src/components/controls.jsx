import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import '../styles/controls.css';

const Controls = ({ show, onPrevious, onNext, disabled }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => !disabled && onNext(),
    onSwipedRight: () => !disabled && onPrevious(),
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
              onClick={onPrevious}
              disabled={disabled}
              className="nav-button nav-button-left"
            >
              <ChevronLeft className="w-8 h-8" />
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onClick={onNext}
              disabled={disabled}
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