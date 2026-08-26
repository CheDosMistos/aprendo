import type * as AlphaTab from '@coderline/alphatab';

export const COURSE_SOUNDFONT_URL = '/soundfont/sonivox.sf2';

let alphaTabModulePromise: Promise<typeof AlphaTab> | null = null;
const resourcePreloads = new Map<string, Promise<void>>();

export function loadAlphaTabModule(): Promise<typeof AlphaTab> {
  alphaTabModulePromise ??= import('@coderline/alphatab');
  return alphaTabModulePromise;
}

function preloadResource(url: string): Promise<void> {
  const existing = resourcePreloads.get(url);
  if (existing) return existing;

  const request = fetch(url, {
    credentials: 'same-origin',
    cache: 'default',
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Could not preload notation resource: ${url}`);
    await response.arrayBuffer();
  });

  resourcePreloads.set(url, request);
  return request;
}

export function preloadNotationResources(scoreUrls: readonly string[]): void {
  void loadAlphaTabModule().catch(() => {});
  void preloadResource(COURSE_SOUNDFONT_URL).catch(() => {});

  for (const url of new Set(scoreUrls.filter(Boolean))) {
    void preloadResource(url).catch(() => {});
  }
}
