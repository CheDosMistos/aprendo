import type * as AlphaTab from '@coderline/alphatab';
import type { NotationRenderer, NotationRendererCallbacks } from './NotationRenderer';
import { ensurePercussionPlaybackMapping } from './ensurePercussionPlaybackMapping';
import { loadAlphaTabModule, preloadNotationResources } from './notationPreload';

export interface AlphaTabRendererOptions {
  enablePlayer?: boolean;
  referenceBpm?: number;
  displayScale?: number;
  stretchForce?: number;
  hideScoreHeader?: boolean;
}

export class AlphaTabRenderer implements NotationRenderer {
  private api: AlphaTab.AlphaTabApi | null = null;
  private readonly callbacks: NotationRendererCallbacks;
  private readonly referenceBpm: number;
  private pendingSourceUrl: string | null = null;
  private playbackBpm: number;
  private displayScale: number;
  private disposed = false;
  private loadRequestId = 0;

  constructor(
    host: HTMLElement,
    callbacks: NotationRendererCallbacks = {},
    options: AlphaTabRendererOptions = {},
  ) {
    this.callbacks = callbacks;
    const enablePlayer = options.enablePlayer ?? true;
    this.displayScale = options.displayScale ?? 1;
    const stretchForce = options.stretchForce ?? 0.8;
    const hideScoreHeader = options.hideScoreHeader ?? false;
    this.referenceBpm = options.referenceBpm ?? 120;
    this.playbackBpm = this.referenceBpm;

    // Start the expensive module + SoundFont work as soon as the lesson mounts,
    // instead of letting the player discover those resources just before first use.
    if (enablePlayer) preloadNotationResources([]);

    void loadAlphaTabModule()
      .then((alphaTab) => {
        if (this.disposed) return;

        const hiddenElements = new Map<AlphaTab.NotationElement, boolean>([
          [alphaTab.NotationElement.ScoreTitle, false],
          [alphaTab.NotationElement.ScoreSubTitle, false],
          [alphaTab.NotationElement.ScoreArtist, false],
          [alphaTab.NotationElement.ScoreAlbum, false],
          [alphaTab.NotationElement.ScoreWords, false],
          [alphaTab.NotationElement.ScoreMusic, false],
          [alphaTab.NotationElement.ScoreWordsAndMusic, false],
          [alphaTab.NotationElement.ScoreCopyright, false],
        ]);

        const api = new alphaTab.AlphaTabApi(host, {
          core: {
            engine: 'svg',
            fontDirectory: '/font/',
          },
          display: {
            scale: this.displayScale,
            stretchForce,
          },
          notation: hideScoreHeader ? { elements: hiddenElements } : undefined,
          player: {
            enablePlayer,
            soundFont: '/soundfont/sonivox.sf2',
            scrollElement: host.parentElement ?? host,
          },
        });
        this.api = api;

        api.renderStarted.on(() => {
          this.callbacks.onStatusChange?.('loading', 'Renderizando partitura…');
        });

        api.renderFinished.on(() => {
          this.callbacks.onStatusChange?.('ready', 'Partitura renderizada');
        });

        if (enablePlayer) {
          api.playerReady.on(() => {
            this.callbacks.onPlaybackReady?.(true);
          });
          api.playerStateChanged.on((args) => {
            this.callbacks.onPlaybackStateChange?.(args.state === alphaTab.synth.PlayerState.Playing);
          });
          api.playerFinished.on(() => {
            this.callbacks.onPlaybackStateChange?.(false);
          });
        }

        api.error.on((error) => {
          const message = error instanceof Error ? error.message : String(error);
          this.callbacks.onStatusChange?.('error', message);
        });

        this.applyPlaybackBpm();
        const sourceUrl = this.pendingSourceUrl;
        this.pendingSourceUrl = null;
        if (sourceUrl) void this.loadSource(api, sourceUrl, this.loadRequestId);
      })
      .catch(() => {
        if (!this.disposed) {
          this.callbacks.onPlaybackReady?.(false);
          this.callbacks.onStatusChange?.('error', 'No se ha podido inicializar el motor de notación.');
        }
      });
  }

  load(sourceUrl: string): boolean {
    this.callbacks.onPlaybackReady?.(false);
    this.callbacks.onPlaybackStateChange?.(false);
    this.callbacks.onStatusChange?.('loading', 'Cargando MusicXML…');
    if (!sourceUrl) return false;

    const requestId = ++this.loadRequestId;

    // Prime the authenticated MusicXML request while AlphaTab is still
    // initializing. The normalized fetch below can reuse the browser cache.
    preloadNotationResources([sourceUrl]);

    if (this.api) {
      void this.loadSource(this.api, sourceUrl, requestId);
    } else {
      this.pendingSourceUrl = sourceUrl;
    }
    return true;
  }

  playPause(): void {
    if (this.api?.isReadyForPlayback) this.api.playPause();
  }

  stop(): void {
    if (this.api?.isReadyForPlayback) this.api.stop();
  }

  setPlaybackBpm(bpm: number): void {
    if (!Number.isFinite(bpm) || this.referenceBpm <= 0) return;
    this.playbackBpm = bpm;
    this.applyPlaybackBpm();
  }

  setDisplayScale(scale: number): void {
    if (!Number.isFinite(scale)) return;
    this.displayScale = Math.min(1.6, Math.max(0.65, scale));
    if (!this.api) return;
    this.api.settings.display.scale = this.displayScale;
    this.api.updateSettings();
    this.api.render();
  }

  dispose(): void {
    this.disposed = true;
    this.pendingSourceUrl = null;
    this.loadRequestId += 1;
    this.api?.destroy();
    this.api = null;
  }

  private async loadSource(api: AlphaTab.AlphaTabApi, sourceUrl: string, requestId: number): Promise<void> {
    if (!/\.musicxml(?:[?#]|$)/i.test(sourceUrl)) {
      if (!api.load(sourceUrl)) this.reportLoadError();
      return;
    }

    try {
      const response = await fetch(sourceUrl, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('MusicXML request failed');
      const xml = ensurePercussionPlaybackMapping(await response.text());
      if (this.disposed || this.api !== api || requestId !== this.loadRequestId) return;
      const bytes = new TextEncoder().encode(xml);
      if (!api.load(bytes)) this.reportLoadError();
    } catch {
      if (this.disposed || this.api !== api || requestId !== this.loadRequestId) return;
      // Preserve URL loading as a conservative fallback if normalization cannot run.
      if (!api.load(sourceUrl)) this.reportLoadError();
    }
  }

  private reportLoadError(): void {
    this.callbacks.onPlaybackReady?.(false);
    this.callbacks.onStatusChange?.('error', 'No se ha podido cargar la partitura.');
  }

  private applyPlaybackBpm(): void {
    if (!this.api) return;
    this.api.playbackSpeed = Math.min(8, Math.max(0.125, this.playbackBpm / this.referenceBpm));
  }
}