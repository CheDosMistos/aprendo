export type NotationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NotationRendererCallbacks {
  onStatusChange?: (status: NotationStatus, message?: string) => void;
  onPlaybackReady?: (ready: boolean) => void;
  onPlaybackStateChange?: (playing: boolean) => void;
}

export interface NotationRenderer {
  load(sourceUrl: string): boolean;
  playPause(): void;
  stop(): void;
  setPlaybackBpm(bpm: number): void;
  dispose(): void;
}
