import React, { useRef, useEffect } from 'react';

const MediaCanvas = ({ media }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());

  // Get average color from the edge of an image
  const getEdgeColors = (ctx, x, y, width, height) => {
    const sampleSize = 10;
    const colors = {
      top: ctx.getImageData(x + width/2, y, sampleSize, 1).data,
      bottom: ctx.getImageData(x + width/2, y + height - 1, sampleSize, 1).data,
      left: ctx.getImageData(x, y + height/2, 1, sampleSize).data,
      right: ctx.getImageData(x + width - 1, y + height/2, 1, sampleSize).data
    };

    // Calculate average RGB for each edge
    return Object.entries(colors).reduce((acc, [edge, data]) => {
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      const pixelCount = data.length / 4;
      acc[edge] = `rgb(${Math.round(r/pixelCount)}, ${Math.round(g/pixelCount)}, ${Math.round(b/pixelCount)})`;
      return acc;
    }, {});
  };

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

      // First draw the image to get its edge colors
      ctx.drawImage(
        imageRef.current,
        x,
        y,
        scaledWidth,
        scaledHeight
      );

      // Get edge colors
      const edgeColors = getEdgeColors(ctx, x, y, scaledWidth, scaledHeight);

      // Clear canvas and fill background with gradients
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Fill left side
      const leftGradient = ctx.createLinearGradient(0, 0, x, 0);
      leftGradient.addColorStop(0, edgeColors.left);
      leftGradient.addColorStop(1, edgeColors.left);
      ctx.fillStyle = leftGradient;
      ctx.fillRect(0, 0, x, canvasHeight);

      // Fill right side
      const rightGradient = ctx.createLinearGradient(x + scaledWidth, 0, canvasWidth, 0);
      rightGradient.addColorStop(0, edgeColors.right);
      rightGradient.addColorStop(1, edgeColors.right);
      ctx.fillStyle = rightGradient;
      ctx.fillRect(x + scaledWidth, 0, canvasWidth - (x + scaledWidth), canvasHeight);

      // Fill top
      const topGradient = ctx.createLinearGradient(0, 0, 0, y);
      topGradient.addColorStop(0, edgeColors.top);
      topGradient.addColorStop(1, edgeColors.top);
      ctx.fillStyle = topGradient;
      ctx.fillRect(x, 0, scaledWidth, y);

      // Fill bottom
      const bottomGradient = ctx.createLinearGradient(0, y + scaledHeight, 0, canvasHeight);
      bottomGradient.addColorStop(0, edgeColors.bottom);
      bottomGradient.addColorStop(1, edgeColors.bottom);
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(x, y + scaledHeight, scaledWidth, canvasHeight - (y + scaledHeight));

      // Draw the image again on top
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