import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/errorToast.css';

const ErrorToast = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="error-toast"
  >
    <AlertCircle className="icon" />
    <p className="message">{message}</p>
  </motion.div>
);

export default ErrorToast;