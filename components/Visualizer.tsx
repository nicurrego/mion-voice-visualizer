import React, { useRef, useEffect } from 'react';
import { VisualizerProps } from '../types';

export const Visualizer: React.FC<VisualizerProps> = ({ 
  analyser, 
  isPlaying, 
  width, 
  height
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
    let colorOffset = 0;

    const render = () => {
      colorOffset -= 1; // Move colors for the wave effect
      
      if (!analyser) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const bars = 20; 
      const step = Math.floor(bufferLength * 0.6 / bars); 
      
      const barMaxWidth = width / bars;
      const barWidth = barMaxWidth * 0.6;
      const gap = barMaxWidth * 0.4;
      
      const centerY = height / 2;
      const totalVisualizerWidth = bars * barMaxWidth;
      const startX = (width - totalVisualizerWidth) / 2 + (gap / 2);

      for (let i = 0; i < bars; i++) {
        const value = dataArray[i * step];
        const barHeight = Math.max(4, (value / 255) * height * 0.9); 

        const x = startX + i * barMaxWidth;
        const y = centerY - barHeight / 2;
        
        // Rainbow Logic: Cycle hue based on position and time
        const hue = (i * 15 + colorOffset) % 360;
        const color = `hsl(${hue}, 90%, 60%)`;

        const gradient = ctx.createLinearGradient(x, centerY - barHeight/2, x, centerY + barHeight/2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); 
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.8, color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

        ctx.fillStyle = gradient;
        
        // Rainbow Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 20);
        } else {
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
        
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
  }, [analyser, isPlaying, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className="pointer-events-none"
    />
  );
};