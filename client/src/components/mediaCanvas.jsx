import React, { useRef, useEffect, useState } from 'react';
import { config } from '../../../config/config.js';

const MediaCanvas = ({ media }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());
  const videoRef = useRef(null);
  const [isVideo, setIsVideo] = useState(false);

  // Video handling functions
  const initializeVideo = () => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.playsInline = true;
      videoRef.current.muted = config.mediaTypes.muted;
      videoRef.current.autoplay = config.mediaTypes.autoplay;
      videoRef.current.loop = config.mediaTypes.loop;
    }
  };

  const playVideo = async () => {
    try {
      videoRef.current.src = `/media/${media.name}`;
      await videoRef.current.play();
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };

  // Image handling functions
  const resizeCanvas = (canvas) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

    // Draw center image
    tempCtx.drawImage(image, x, y, scaledWidth, scaledHeight);

    // Apply blur
    tempCtx.filter = 'blur(20px)';

    // Draw edges
    const edges = [
      // Left edge
      { sx: 0, sy: 0, sw: 1, sh: imgHeight, dx: 0, dy: 0, dw: x, dh: canvasHeight },
      // Right edge
      { sx: imgWidth - 1, sy: 0, sw: 1, sh: imgHeight, dx: x + scaledWidth, dy: 0, dw: canvasWidth - (x + scaledWidth), dh: canvasHeight },
      // Top edge
      { sx: 0, sy: 0, sw: imgWidth, sh: 1, dx: x, dy: 0, dw: scaledWidth, dh: y },
      // Bottom edge
      { sx: 0, sy: imgHeight - 1, sw: imgWidth, sh: 1, dx: x, dy: y + scaledHeight, dw: scaledWidth, dh: canvasHeight - (y + scaledHeight) }
    ];

    edges.forEach(edge => {
      tempCtx.drawImage(image, edge.sx, edge.sy, edge.sw, edge.sh, edge.dx, edge.dy, edge.dw, edge.dh);
    });

    return tempCanvas;
  };

  const drawImage = () => {
    if (!imageRef.current.complete) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    const dimensions = calculateImageDimensions(
      image.width,
      image.height,
      canvas.width,
      canvas.height
    );

    const blurredBackground = createBlurredBackground(
      image,
      dimensions,
      canvas.width,
      canvas.height
    );

    // Reset filter and draw final composition
    ctx.filter = 'none';
    ctx.drawImage(blurredBackground, 0, 0);
    ctx.drawImage(
      image,
      dimensions.x,
      dimensions.y,
      dimensions.scaledWidth,
      dimensions.scaledHeight
    );
  };

  // Main effect for handling media changes
  useEffect(() => {
    if (!media) return;

    const isVideoFile = new RegExp(`(${config.mediaTypes.videoTypes.join('|')})$`, 'i').test(media.name);
    setIsVideo(isVideoFile);

    if (isVideoFile) {
      initializeVideo();
      playVideo();
    } else {
      const canvas = canvasRef.current;

      const handleResize = () => {
        resizeCanvas(canvas);
        drawImage();
      };

      imageRef.current.onload = drawImage;
      imageRef.current.src = `/media/${media.name}`;

      window.addEventListener('resize', handleResize);
      resizeCanvas(canvas);

      return () => {
        window.removeEventListener('resize', handleResize);
        imageRef.current.onload = null;
      };
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [media]);

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        muted
        autoPlay
        loop
        src={`/media/${media?.name}`}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
    />
  );
};

export default MediaCanvas;