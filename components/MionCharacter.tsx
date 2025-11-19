import React, { useRef, useEffect } from 'react';
import { Visualizer } from './Visualizer';

interface MionCharacterProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  imageUrl: string;
  mistColor?: string; // New prop for emotion color
}

export const MionCharacter: React.FC<MionCharacterProps> = ({ 
  analyser, 
  isPlaying,
  imageUrl,
  mistColor = '#38bdf8' // Default to blue (Calm)
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const size = 500; // Base size for the container

  // Dimensions for the visualizer (50% of container)
  const visWidth = size * 0.5;
  const visHeight = size * 0.38;

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
      const speechRange = Math.floor(bufferLength * 0.7); // Use lower half of spectrum
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
      
      <style>{`
        @keyframes mist-breathe {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(0.95); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        }
        .mist-animation {
          animation: mist-breathe 4s ease-in-out infinite;
        }
      `}</style>

      {/* 
        Layer 0: The Emotion Mist
        - ALWAYS VISIBLE: Independent of isPlaying
        - Uses custom keyframe animation for breathing effect
        - Same size/pos as visualizer
      */}
      <div 
        className="mist-animation absolute z-0 rounded-full"
        style={{ 
          width: visWidth, 
          height: visHeight,
          bottom: '3.5%',
          left: '53%',
          // transform is handled by animation keyframes, but we set initial here for safety/fallback
          // Note: keyframes override inline transform, so we include translateX in keyframes
          background: `radial-gradient(circle at center, ${mistColor} 0%, transparent 90%)`,
          filter: 'blur(5px)',
        }}
      />

      {/* 
        Layer 1: The Visualizer 
        - Size: 50% of width and height (visWidth, visHeight)
        - Position: Bottom Center (bottom-0, left-1/2)
        - Z-Index: 10 (In front of mist, behind image)
      */}
      <div 
        className="absolute z-10 flex items-center justify-center"
        style={{ 
          width: visWidth, 
          height: visHeight,
          bottom: '3.5%',
          left: '53%',
          transform: 'translateX(-50%)',
        }}
      >
        <Visualizer 
          analyser={analyser} 
          isPlaying={isPlaying} 
          width={visWidth} 
          height={visHeight}
          color={mistColor} // Sync visualizer color with emotion
        />
      </div>

      {/* 
        Layer 2: The Mion Character Image
        Z-index 20 to be in front.
      */}
      <div className="relative z-20 w-full h-full flex items-center justify-center pointer-events-none">
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Mion Character" 
          className="object-contain w-full h-full drop-shadow-2xl transition-transform duration-75 will-change-transform"
          onError={(e) => {
            console.warn("Image failed to load, checking path...");
            e.currentTarget.style.opacity = "0.5";
          }}
        />
      </div>
      
    </div>
  );
};