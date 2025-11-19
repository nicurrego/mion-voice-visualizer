import React, { useRef, useEffect } from 'react';
import { Visualizer } from './Visualizer';

interface MionCharacterProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  imageUrl: string;
}

export const MionCharacter: React.FC<MionCharacterProps> = ({ 
  analyser, 
  isPlaying,
  imageUrl
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const size = 500; // Base size for the container

  // Audio reactive bounce effect
  useEffect(() => {
    if (!isPlaying || !analyser) {
      if (imageRef.current) {
        imageRef.current.style.transform = 'scale(1)';
      }
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let rafId: number;

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume from lower frequencies (speech range)
      let sum = 0;
      const speechRange = Math.floor(bufferLength * 0.5); // Use lower half of spectrum
      for (let i = 0; i < speechRange; i++) {
        sum += dataArray[i];
      }
      const average = sum / speechRange;
      
      // Map average volume (0-255) to a gentle scale factor (1.0 - 1.05)
      const scale = 1 + (average / 255) * 0.05;

      if (imageRef.current) {
        imageRef.current.style.transform = `scale(${scale})`;
      }
      
      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      if (imageRef.current) {
         imageRef.current.style.transform = 'scale(1)';
      }
    };
  }, [analyser, isPlaying]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      
      {/* 
        Layer 1: The Visualizer 
        Placed absolutely in the center behind the image (z-0).
        Updated to Blue tones (#38bdf8 - Sky Blue).
        Width is slightly wider than the container so bars poke out nicely.
      */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-90">
        <Visualizer 
          analyser={analyser} 
          isPlaying={isPlaying} 
          width={size * 1.4} 
          height={size * 1.2}
          color="#38bdf8" 
        />
      </div>

      {/* 
        Layer 2: The Mion Character Image
        Z-index 10 to be in front.
        The image bounces slightly based on audio volume.
      */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Mion Character" 
          className="object-contain w-full h-full drop-shadow-2xl transition-transform duration-75 will-change-transform"
          onError={(e) => {
            // Fallback if image load fails
            console.warn("Image failed to load, checking path...");
            e.currentTarget.style.opacity = "0.5";
          }}
        />
      </div>
      
    </div>
  );
};