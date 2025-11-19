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
  const size = 500; 

  const visWidth = size * 0.5;
  const visHeight = size * 0.33;

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

      let sum = 0;
      const speechRange = Math.floor(bufferLength * 0.7); 
      for (let i = 0; i < speechRange; i++) {
        sum += dataArray[i];
      }
      const average = sum / speechRange;
      
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
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(0.95); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        }
        @keyframes rainbow-cycle {
          0% { filter: hue-rotate(0deg) blur(20px); }
          100% { filter: hue-rotate(360deg) blur(20px); }
        }
        .mist-animation {
          animation: mist-breathe 4s ease-in-out infinite, rainbow-cycle 8s linear infinite;
        }
      `}</style>

      {/* 
        Layer -1: Solid Color Background
        - Behind the mist
        - Solid color that also cycles through rainbow
      */}
      <div 
        className="mist-animation absolute z-0 rounded-full"
        style={{ 
          width: visWidth, 
          height: visHeight,
          bottom: '13%',
          left: '53%',
          background: '#ff0000', // Solid red base
          opacity: 0.3, 
        }}
      />

      {/* 
        Layer 0: The Rainbow Mist
        - Uses hue-rotate to cycle through colors (rainbow)
        - Base color is Red, which rotates through the spectrum
      */}
      <div 
        className="mist-animation absolute z-0 rounded-full"
        style={{ 
          width: visWidth, 
          height: visHeight,
          bottom: '0%',
          left: '53%',
          background: `radial-gradient(circle at center, #ff0000 0%, transparent 70%)`,
        }}
      />

      <div 
        className="absolute z-10 flex items-center justify-center"
        style={{ 
          width: visWidth, 
          height: visHeight,
          bottom: '6.5%',
          left: '53%',
          transform: 'translateX(-50%)',
        }}
      >
        <Visualizer 
          analyser={analyser} 
          isPlaying={isPlaying} 
          width={visWidth} 
          height={visHeight}
        />
      </div>

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