import React, { useRef, useEffect } from 'react';
import { VisualizerProps } from '../types';

export const Visualizer: React.FC<VisualizerProps> = ({ 
  analyser, 
  isPlaying, 
  width, 
  height,
  color = '#3b82f6' // Default blue-500
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    let animationId: number;

    const render = () => {
      if (!analyser) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Configuration for Vertical Bars (Waveform style)
      // We create a mirrored equalizer effect (growing up and down from center)
      const bars = 20; // Number of bars
      // We sample from the lower end of the spectrum (bass/vocals) for better movement
      const step = Math.floor(bufferLength * 0.6 / bars); 
      
      const barMaxWidth = width / bars;
      const barWidth = barMaxWidth * 0.6; // Actual bar width
      const gap = barMaxWidth * 0.4;      // Gap between bars
      
      const centerY = height / 2;
      // Calculate total width to center the visualization horizontally
      const totalVisualizerWidth = bars * barMaxWidth;
      const startX = (width - totalVisualizerWidth) / 2 + (gap / 2);

      for (let i = 0; i < bars; i++) {
        // Get frequency value
        const value = dataArray[i * step];
        
        // Scale value to height
        // Maximum height is 90% of the canvas height
        const barHeight = Math.max(4, (value / 255) * height * 0.9); 

        const x = startX + i * barMaxWidth;
        const y = centerY - barHeight / 2;
        
        // Create a gradient for the bar
        // Middle is solid color, tips fade out slightly
        const gradient = ctx.createLinearGradient(x, centerY - barHeight/2, x, centerY + barHeight/2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); 
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.8, color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

        ctx.fillStyle = gradient;
        
        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;

        ctx.beginPath();
        // Use roundRect if supported, otherwise rect
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 20);
        } else {
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
        
        // Reset shadow for performance or next elements
        ctx.shadowBlur = 0;
      }

      if (isPlaying) {
        animationId = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      render();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying, width, height, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="pointer-events-none"
    />
  );
};