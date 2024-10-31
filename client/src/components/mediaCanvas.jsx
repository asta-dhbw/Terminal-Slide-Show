import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { config } from '../../../config/config.js';

const MediaCanvas = ({ media }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());
  const videoRef = useRef(null);
  const [mediaType, setMediaType] = useState('image');
  const [dimensions, setDimensions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);

  const getMediaType = (filename) => {
    const extension = filename.toLowerCase().split('.').pop();
    if (extension === 'gif') return 'gif';
    if (config.mediaTypes.videoTypes.some(type => type.includes(extension))) return 'video';
    return 'image';
  };

  const calculateImageDimensions = (imgWidth, imgHeight, canvasWidth, canvasHeight) => {
    const scale = Math.min(
      canvasWidth / imgWidth,
      canvasHeight / imgHeight
    );

    return {
      scaledWidth: imgWidth * scale,
      scaledHeight: imgHeight * scale,
      x: (canvasWidth - imgWidth * scale) / 2,
      y: (canvasHeight - imgHeight * scale) / 2
    };
  };

  const createBlurredBackground = (image, dimensions, canvasWidth, canvasHeight) => {
    const { scaledWidth, scaledHeight, x, y } = dimensions;
    const { width: imgWidth, height: imgHeight } = image;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;

    tempCtx.drawImage(image, x, y, scaledWidth, scaledHeight);
    tempCtx.filter = 'blur(20px)';

    const edges = [
      { sx: 0, sy: 0, sw: 1, sh: imgHeight, dx: 0, dy: 0, dw: x, dh: canvasHeight },
      { sx: imgWidth - 1, sy: 0, sw: 1, sh: imgHeight, dx: x + scaledWidth, dy: 0, dw: canvasWidth - (x + scaledWidth), dh: canvasHeight },
      { sx: 0, sy: 0, sw: imgWidth, sh: 1, dx: x, dy: 0, dw: scaledWidth, dh: y },
      { sx: 0, sy: imgHeight - 1, sw: imgWidth, sh: 1, dx: x, dy: y + scaledHeight, dw: scaledWidth, dh: canvasHeight - (y + scaledHeight) }
    ];

    edges.forEach(edge => {
      tempCtx.drawImage(image, edge.sx, edge.sy, edge.sw, edge.sh, edge.dx, edge.dy, edge.dw, edge.dh);
    });

    return tempCanvas;
  };

  const updateCanvas = (image) => {
    if (!image?.complete || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    
    const dims = calculateImageDimensions(
      image.width,
      image.height,
      canvas.width,
      canvas.height
    );

    const blurredBackground = createBlurredBackground(
      image,
      dims,
      canvas.width,
      canvas.height
    );

    ctx.filter = 'none';
    ctx.drawImage(blurredBackground, 0, 0);
    
    if (mediaType !== 'gif') {
      ctx.drawImage(
        image,
        dims.x,
        dims.y,
        dims.scaledWidth,
        dims.scaledHeight
      );
    }

    setDimensions(dims);
    setIsLoading(false);
  };

  const handleVideoEnd = () => {
    if (!config.mediaTypes.loop) {
      setIsVideoEnded(true);
      // Pause the video on the last frame
      if (videoRef.current) {
        videoRef.current.currentTime = videoRef.current.duration;
      }
    }
  };

  useEffect(() => {
    if (!media) return;

    setIsLoading(true);
    setDimensions(null);
    setIsVideoEnded(false);

    const type = getMediaType(media.name);
    setMediaType(type);

    // Clean up previous media
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }

    if (type === 'video') {
      // Initialize video
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
      }
      videoRef.current.playsInline = true;
      videoRef.current.muted = config.mediaTypes.muted;
      videoRef.current.autoplay = config.mediaTypes.autoplay;
      videoRef.current.loop = config.mediaTypes.loop;
      videoRef.current.src = `/media/${media.name}`;
      
      // Add ended event listener
      videoRef.current.addEventListener('ended', handleVideoEnd);
      
      videoRef.current.play().catch(console.error);
      setIsLoading(false);
    } else {
      // Handle images and GIFs
      const handleResize = () => {
        if (imageRef.current?.complete) {
          updateCanvas(imageRef.current);
        }
      };

      imageRef.current = new Image();
      imageRef.current.onload = () => updateCanvas(imageRef.current);
      imageRef.current.src = `/media/${media.name}`;

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (imageRef.current) {
          imageRef.current.onload = null;
        }
        if (videoRef.current) {
          videoRef.current.removeEventListener('ended', handleVideoEnd);
        }
      };
    }
  }, [media]);

  if (mediaType === 'video') {
    return (
      <motion.video
        key={media.name + "-video"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
        loop={config.mediaTypes.loop}
        onEnded={handleVideoEnd}
        src={`/media/${media?.name}`}
      />
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black"
      key={media.name + "-image"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      {mediaType === 'gif' && dimensions && !isLoading && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <img
            src={`/media/${media?.name}`}
            alt="Animated GIF"
            style={{
              position: 'absolute',
              left: dimensions.x,
              top: dimensions.y,
              width: dimensions.scaledWidth,
              height: dimensions.scaledHeight,
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default MediaCanvas;