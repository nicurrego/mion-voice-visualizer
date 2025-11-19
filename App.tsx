import React, { useState, useRef, useEffect } from 'react';
import { MionCharacter } from './components/MionCharacter';
import { generateSpeech } from './services/geminiService';
import { Mic, Play, Square, Loader2, AlertCircle } from 'lucide-react';

// Updated path: Standard web servers map the public directory to root.
const MION_IMAGE_URL = "/image/TheMION.png"; 

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("Hello! I am Mion, your relaxing spa companion. I'm here to help you unwind. Let's take a deep breath together!");
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // Increased for smoother visualizer data
      analyserRef.current = analyser;
    }
    return audioContextRef.current;
  };

  const handleSpeak = async () => {
    setError(null);
    if (!process.env.API_KEY) {
      setError("Missing API Key. Please set process.env.API_KEY.");
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Initialize Audio Context (must be done after user gesture)
      const ctx = initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 2. Fetch Audio from Gemini
      const audioBuffer = await generateSpeech(promptText, ctx);

      // 3. Prepare Source Node
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {} // Stop previous if playing
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // 4. Connect Graph: Source -> Analyser -> Destination (Speakers)
      if (analyserRef.current) {
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      sourceRef.current = source;

      // 5. Play
      source.onended = () => setIsPlaying(false);
      source.start(0);
      setIsPlaying(true);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate speech");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
      </div>

      <header className="z-10 mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
          Mion Voice
        </h1>
        <p className="text-slate-400">Powered by Gemini 2.5 Flash TTS</p>
      </header>

      {/* Main Character Display */}
      <div className="z-10 mb-12 relative">
        <MionCharacter 
          analyser={analyserRef.current} 
          isPlaying={isPlaying}
          imageUrl={MION_IMAGE_URL}
        />
      </div>

      {/* Controls */}
      <div className="z-10 w-full max-w-lg bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-xl">
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            What should Mion say?
          </label>
          <textarea 
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none transition-all"
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isLoading || isPlaying}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
           {/* Status Indicator */}
           <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="text-sm text-slate-400 font-mono">
                {isLoading ? 'GENERATING...' : isPlaying ? 'SPEAKING' : 'IDLE'}
              </span>
           </div>

           {/* Action Buttons */}
           <div className="flex gap-3">
             {isPlaying ? (
               <button 
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded-full transition-all font-semibold"
               >
                 <Square size={18} fill="currentColor" />
                 Stop
               </button>
             ) : (
               <button 
                onClick={handleSpeak}
                disabled={isLoading || !promptText.trim()}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-slate-900 transition-all
                  ${isLoading || !promptText.trim() 
                    ? 'bg-slate-600 cursor-not-allowed opacity-50' 
                    : 'bg-yellow-400 hover:bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                  }`}
               >
                 {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                 Say Hello
               </button>
             )}
           </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-xs text-slate-600">
        Ensure your API Key is set in the environment.
      </div>

    </div>
  );
};

export default App;