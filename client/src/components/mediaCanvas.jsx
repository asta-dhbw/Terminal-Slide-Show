import React, { useRef, useEffect } from 'react';
import '../styles/mediaCanvas.css';

const MediaCanvas = ({ media }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!media) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    imageRef.current = image;

    const resizeCanvas = () => {
      const { innerWidth: width, innerHeight: height } = window;
      canvas.width = width;
      canvas.height = height;
    };

    const drawImage = () => {
      if (!imageRef.current.complete) return;

      const { width: imgWidth, height: imgHeight } = imageRef.current;
      const { width: canvasWidth, height: canvasHeight } = canvas;

      const scale = Math.min(
        canvasWidth / imgWidth,
        canvasHeight / imgHeight
      );

      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(
        imageRef.current,
        x,
        y,
        scaledWidth,
        scaledHeight
      );
    };

    image.onload = drawImage;
    image.src = `/media/${media.name}`;

    window.addEventListener('resize', () => {
      resizeCanvas();
      drawImage();
    });

    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (imageRef.current) {
        imageRef.current.onload = null;
      }
    };
  }, [media]);

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
    />
  );
};

export default MediaCanvas;