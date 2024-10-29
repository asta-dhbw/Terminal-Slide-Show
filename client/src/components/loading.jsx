import React from 'react';
import { Loader2, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/loading.css';

const Loading = ({ isServerConnecting }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="loading-overlay"
  >
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        rotate: isServerConnecting ? [0, 0, 0] : [0, 360, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="icon"
    >
      {isServerConnecting ? (
        <Server />
      ) : (
        <Loader2 />
      )}
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="loading-text"
    >
      {isServerConnecting ? 'Connecting to server...' : 'Loading media...'}
    </motion.p>
  </motion.div>
);

export default Loading;