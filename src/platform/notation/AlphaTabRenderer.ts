import * as alphaTab from '@coderline/alphatab';
import type { NotationRenderer, NotationRendererCallbacks } from './NotationRenderer';

export class AlphaTabRenderer implements NotationRenderer {
  private readonly api: alphaTab.AlphaTabApi;
  private readonly callbacks: NotationRendererCallbacks;

  constructor(host: HTMLElement, callbacks: NotationRendererCallbacks = {}) {
    this.callbacks = callbacks;
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
        enablePlayer: true,
        soundFont: '/soundfont/sonivox.sf2',
        scrollElement: host.parentElement,
      },
    });

    this.api.renderStarted.on(() => {
      this.callbacks.onStatusChange?.('loading', 'Renderizando partitura…');
    });

    this.api.renderFinished.on(() => {
      this.callbacks.onStatusChange?.('ready', 'Partitura renderizada');
    });

    this.api.playerReady.on(() => {
      this.callbacks.onPlaybackReady?.(true);
    });

    this.api.error.on((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.callbacks.onStatusChange?.('error', message);
    });
  }

  load(sourceUrl: string): boolean {
    this.callbacks.onPlaybackReady?.(false);
    this.callbacks.onStatusChange?.('loading', 'Cargando MusicXML…');
    return this.api.load(sourceUrl);
  }

  playPause(): void {
    if (this.api.isReadyForPlayback) this.api.playPause();
  }

  stop(): void {
    if (this.api.isReadyForPlayback) this.api.stop();
  }

  dispose(): void {
    this.api.destroy();
  }
}
