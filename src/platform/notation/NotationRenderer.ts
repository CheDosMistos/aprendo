export type NotationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NotationRendererCallbacks {
  onStatusChange?: (status: NotationStatus, message?: string) => void;
  onPlaybackReady?: (ready: boolean) => void;
}

export interface NotationRenderer {
  load(sourceUrl: string): boolean;
  playPause(): void;
  stop(): void;
  dispose(): void;
}
