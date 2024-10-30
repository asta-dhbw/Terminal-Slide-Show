import React from 'react';
import { Server } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/loading.css';
import BBLoader from './loader';

const Loading = ({ isServerConnecting }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="loading-overlay"
  >
    <div className="loading-overlay-background" />
    <motion.div
      animate={
        isServerConnecting ? {
          scale: [1, 1.15, 0.95, 1.1, 1],
        } : {
          scale: [1, 1.1, 1],
          filter: [
            "drop-shadow(0 0 0px rgba(255,255,255,0)) drop-shadow(0 0 0px rgba(0,123,255,0))",
            "drop-shadow(0 0 30px rgba(255,255,255,1)) drop-shadow(0 0 60px rgba(0,123,255,0.8))",
            "drop-shadow(0 0 20px rgba(255,255,255,0.6)) drop-shadow(0 0 40px rgba(0,123,255,0.5))",
            "drop-shadow(0 0 0px rgba(255,255,255,0)) drop-shadow(0 0 0px rgba(0,123,255,0))"
          ]
        }
      }
    >
      {isServerConnecting ? (
        <motion.div
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.05, 0.95, 1],
            filter: [
              "drop-shadow(0 0 0px rgba(255,255,255,0)) drop-shadow(0 0 0px rgba(0,123,255,0))",
              "drop-shadow(0 0 30px rgba(255,255,255,1)) drop-shadow(0 0 60px rgba(0,123,255,0.8))",
              "drop-shadow(0 0 20px rgba(255,255,255,0.6)) drop-shadow(0 0 40px rgba(0,123,255,0.5))",
              "drop-shadow(0 0 0px rgba(255,255,255,0)) drop-shadow(0 0 0px rgba(0,123,255,0))"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: 100,
            height: 100,
            transformStyle: "preserve-3d",
            transformOrigin: "center center"
          }}
        >
          <Server 
            style={{ 
              width: "100%", 
              height: "100%",
            }} 
          />
        </motion.div>
      ) : (
        <BBLoader loading={true} color="#FFFFFF" size={100} />
      )}
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={isServerConnecting ? {
        opacity: [0.4, 1, 0.4],
        y: [0, -5, 0],
        filter: [
          "drop-shadow(0 0 0px rgba(255,255,255,0))",
          "drop-shadow(0 0 20px rgba(255,255,255,1))",
          "drop-shadow(0 0 0px rgba(255,255,255,0))"
        ]
      } : {
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="loading-text"
    >
      {isServerConnecting ? 'Connecting to server...' : 'Loading media...'}
    </motion.p>
  </motion.div>
);

export default Loading;