import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/errorToast.css';

const ErrorToast = ({ message }) => {
  useEffect(() => {
    // Add class to body when component mounts
    document.body.classList.add('error-toast-active');

    // Remove class from body when component unmounts
    return () => {
      document.body.classList.remove('error-toast-active');
    };
  }, []);

  return (
    <>
      <div className="overlay"></div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="error-toast"
      >
        <AlertCircle className="icon" />
        <p className="message">{message}</p>
      </motion.div>
    </>
  );
};

export default ErrorToast;