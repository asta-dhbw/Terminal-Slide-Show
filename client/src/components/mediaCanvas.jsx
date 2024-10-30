import React, { useRef, useEffect } from 'react';

const MediaCanvas = ({ media }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());

  useEffect(() => {
    if (!media) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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

      // Create temporary canvas for blur effects
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;

      // Draw the image to get edge portions
      tempCtx.drawImage(
        imageRef.current,
        x,
        y,
        scaledWidth,
        scaledHeight
      );

      // Apply blur to temp canvas
      tempCtx.filter = 'blur(20px)';

      // Draw left side - stretched and blurred
      tempCtx.drawImage(
        imageRef.current,
        0, 0, 1, imgHeight,  // Source: left edge strip
        0, 0, x, canvasHeight  // Destination: left area
      );

      // Draw right side - stretched and blurred
      tempCtx.drawImage(
        imageRef.current,
        imgWidth - 1, 0, 1, imgHeight,  // Source: right edge strip
        x + scaledWidth, 0, canvasWidth - (x + scaledWidth), canvasHeight  // Destination: right area
      );

      // Draw top - stretched and blurred
      tempCtx.drawImage(
        imageRef.current,
        0, 0, imgWidth, 1,  // Source: top edge strip
        x, 0, scaledWidth, y  // Destination: top area
      );

      // Draw bottom - stretched and blurred
      tempCtx.drawImage(
        imageRef.current,
        0, imgHeight - 1, imgWidth, 1,  // Source: bottom edge strip
        x, y + scaledHeight, scaledWidth, canvasHeight - (y + scaledHeight)  // Destination: bottom area
      );

      // Reset filter for main canvas
      ctx.filter = 'none';

      // Draw the blurred background onto main canvas
      ctx.drawImage(tempCanvas, 0, 0);

      // Draw the original image in the center
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