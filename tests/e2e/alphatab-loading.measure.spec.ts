import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const pasSourceUrl = 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf';

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').press('Control+A');
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(/\/$/);
}

async function scriptResources(page: import('@playwright/test').Page) {
  return page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry as PerformanceResourceTiming)
    .filter((entry) => entry.initiatorType === 'script' || /\.(?:js|mjs)(?:\?|$)/.test(entry.name))
    .map((entry) => ({
      name: new URL(entry.name).pathname,
      encodedBodySize: entry.encodedBodySize,
    })));
}

const alphaTabBytes = (resources: Awaited<ReturnType<typeof scriptResources>>) => resources
  .filter((resource) => /alphatab/i.test(resource.name))
  .reduce((sum, resource) => sum + resource.encodedBodySize, 0);

async function expectRudimentScore(
  page: import('@playwright/test').Page,
  rudiment: string,
  expectedSource?: string,
) {
  const score = page.locator(`[data-score-rudiment="${rudiment}"]`);
  await expect(score, `${rudiment} should have exactly one score`).toHaveCount(1);
  await expect(score).toBeVisible();
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeEnabled({ timeout: 15_000 });
  await expect(score.getByRole('link', { name: 'Referencia normativa PAS' })).toHaveAttribute('href', pasSourceUrl);
  await expect(score.getByRole('link', { name: 'Abrir fuente MusicXML' })).toBeVisible();
  if (expectedSource) await expect(score).toHaveAttribute('data-score-src', expectedSource);
  return score;
}

test('PERF-001 loads the alphaTab engine only on pages that contain notation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single-browser loading regression');
  await login(page);

  await page.goto('/bateria/unidad-1/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-notation-score]')).toHaveCount(0);
  const withoutNotation = await scriptResources(page);
  expect(alphaTabBytes(withoutNotation)).toBeLessThan(100_000);
  expect(withoutNotation.some((resource) => /alphatab\.worker/i.test(resource.name))).toBe(false);

  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');
  await expect(page.locator('[data-notation-score]')).toHaveCount(1);
  await expect(page.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  const withNotation = await scriptResources(page);
  expect(alphaTabBytes(withNotation)).toBeGreaterThan(500_000);
});

test('PERF-002 preloads score playback assets and exposes source provenance when a lesson opens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single-browser loading regression');
  await login(page);

  const requested = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === new URL(page.url()).origin) requested.add(url.pathname);
  });

  await page.goto('/bateria/unidad-1/leccion-1-rebote-pulso-rolls/');

  const single = await expectRudimentScore(
    page,
    'Single Stroke Roll',
    '/bateria/notation/u1/preparacion-alternancia-pulso.musicxml',
  );
  await expectRudimentScore(
    page,
    'Multiple Bounce Roll',
    '/bateria/notation/rudiments/04-multiple-bounce-roll.musicxml',
  );

  await expect(single.getByRole('link', { name: 'Abrir fuente MusicXML' }))
    .toHaveAttribute('href', '/bateria/notation/u1/preparacion-alternancia-pulso.musicxml');

  // No playback click has occurred: these requests must start as part of lesson initialization.
  expect(requested.has('/soundfont/sonivox.sf2')).toBe(true);
  expect(requested.has('/bateria/notation/u1/preparacion-alternancia-pulso.musicxml')).toBe(true);
  expect(requested.has('/bateria/notation/rudiments/04-multiple-bounce-roll.musicxml')).toBe(true);
});

test('NOTATION-001 gives every U1 taught rudiment its own score instead of letting reading notation satisfy the lesson', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single-browser notation contract');
  await login(page);

  await page.goto('/bateria/unidad-1/leccion-2-doubles-paradiddle/');
  await expectRudimentScore(page, 'Double Stroke Open Roll', '/bateria/notation/rudiments/06-double-stroke-open-roll.musicxml');
  await expectRudimentScore(page, 'Single Paradiddle', '/bateria/notation/rudiments/16-single-paradiddle.musicxml');
  await expect(page.locator('[data-score-rudiment]')).toHaveCount(2);
  await expect(page.locator('[data-score-src="/bateria/notation/u1/lectura-practica-a3-a6.musicxml"]')).toHaveCount(1);

  await page.goto('/bateria/unidad-1/leccion-3-flam-drag-alturas/');
  await expectRudimentScore(page, 'Flam', '/bateria/notation/u1/preparacion-adorno-principal.musicxml');
  await expectRudimentScore(page, 'Drag (Ruff)', '/bateria/notation/rudiments/31-drag.musicxml');
  await expect(page.locator('[data-score-rudiment]')).toHaveCount(2);
});

test('NOTATION-002 applies the per-rudiment score contract beyond Unit 1', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single-browser notation contract');
  await login(page);

  await page.goto('/bateria/unidad-4/leccion-1-rolls-largos/');
  await expectRudimentScore(page, 'Thirteen Stroke Roll', '/bateria/notation/rudiments/13-thirteen-stroke-roll.musicxml');
  await expectRudimentScore(page, 'Fifteen Stroke Roll', '/bateria/notation/rudiments/14-fifteen-stroke-roll.musicxml');
  await expect(page.locator('[data-score-rudiment]')).toHaveCount(2);
});
