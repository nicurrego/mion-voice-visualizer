export enum VisualizerMode {
  RADIAL_BARS = 'RADIAL_BARS',
  WAVE = 'WAVE'
}

export interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  width: number;
  height: number;
  color?: string;
}

export interface TTSConfig {
  text: string;
  voiceName?: string;
}
