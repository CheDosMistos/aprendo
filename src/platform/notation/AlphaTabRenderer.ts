import * as alphaTab from '@coderline/alphatab';
import type { NotationRenderer, NotationRendererCallbacks } from './NotationRenderer';

export interface AlphaTabRendererOptions {
  enablePlayer?: boolean;
  referenceBpm?: number;
}

export class AlphaTabRenderer implements NotationRenderer {
  private readonly api: alphaTab.AlphaTabApi;
  private readonly callbacks: NotationRendererCallbacks;
  private readonly referenceBpm: number;

  constructor(
    host: HTMLElement,
    callbacks: NotationRendererCallbacks = {},
    options: AlphaTabRendererOptions = {},
  ) {
    this.callbacks = callbacks;
    const enablePlayer = options.enablePlayer ?? true;
    this.referenceBpm = options.referenceBpm ?? 120;

    this.api = new alphaTab.AlphaTabApi(host, {
      core: {
        engine: 'svg',
        fontDirectory: '/font/',
      },
      display: {
        scale: 1,
        stretchForce: 0.8,
      },
      player: {
        enablePlayer,
        soundFont: '/soundfont/sonivox.sf2',
        scrollElement: host.parentElement ?? host,
      },
    });

    this.api.renderStarted.on(() => {
      this.callbacks.onStatusChange?.('loading', 'Renderizando partitura…');
    });

    this.api.renderFinished.on(() => {
      this.callbacks.onStatusChange?.('ready', 'Partitura renderizada');
    });

    if (enablePlayer) {
      this.api.playerReady.on(() => {
        this.callbacks.onPlaybackReady?.(true);
      });
      this.api.playerStateChanged.on((args) => {
        this.callbacks.onPlaybackStateChange?.(args.state === alphaTab.synth.PlayerState.Playing);
      });
      this.api.playerFinished.on(() => {
        this.callbacks.onPlaybackStateChange?.(false);
      });
    }

    this.api.error.on((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.callbacks.onStatusChange?.('error', message);
    });
  }

  load(sourceUrl: string): boolean {
    this.callbacks.onPlaybackReady?.(false);
    this.callbacks.onPlaybackStateChange?.(false);
    this.callbacks.onStatusChange?.('loading', 'Cargando MusicXML…');
    return this.api.load(sourceUrl);
  }

  playPause(): void {
    if (this.api.isReadyForPlayback) this.api.playPause();
  }

  stop(): void {
    if (this.api.isReadyForPlayback) this.api.stop();
  }

  setPlaybackBpm(bpm: number): void {
    if (!Number.isFinite(bpm) || this.referenceBpm <= 0) return;
    this.api.playbackSpeed = Math.min(8, Math.max(0.125, bpm / this.referenceBpm));
  }

  dispose(): void {
    this.api.destroy();
  }
}
