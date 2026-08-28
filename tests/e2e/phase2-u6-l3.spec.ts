import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, {
      form: { username, password },
      headers: { Origin: baseUrl },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    const match = /(?:^|,\s*)aprendo_session=([^;]+)/i.exec(response.headers()['set-cookie'] ?? '');
    expect(match?.[1]).toBeTruthy();
    const url = new URL(baseUrl);
    await page.context().addCookies([{
      name: 'aprendo_session', value: match![1], domain: url.hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Strict',
    }]);
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

const lessonUrl = '/bateria/fase-2-unidad-6/3-4-y-6-8-misma-cantidad-escrita-distinta-metrica/';

test('Phase 2 U6 L3 renders paired 3/4 and 6/8 scores with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto(lessonUrl);

  await expect(page.getByRole('heading', { level: 1, name: '3/4 y 6/8: misma cantidad escrita, distinta métrica' })).toBeVisible();
  await expect(page.locator('blockquote').filter({ hasText: 'MISMAS SEIS CORCHEAS ≠ MISMA MÉTRICA.' })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const score34 = scores.nth(0);
  const score68 = scores.nth(1);
  for (const score of [score34, score68]) {
    await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
    await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
    await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
    await expect(score.locator('.course-score__play')).toBeHidden();
    await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  }

  await expect(score34.getByRole('link', { name: 'MusicXML — fuente del ejercicio 3/4' })).toHaveAttribute('href', '/bateria/notation/f2/u6/f2-u6-l3-seis-corcheas-3-4.musicxml');
  await expect(score68.getByRole('link', { name: 'MusicXML — fuente del ejercicio 6/8' })).toHaveAttribute('href', '/bateria/notation/f2/u6/f2-u6-l3-seis-corcheas-6-8.musicxml');

  await score34.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score34.locator('.course-score__play')).toBeVisible();
  await expect(score68.locator('.course-score__play')).toBeHidden();

  await score68.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score68.locator('.course-score__play')).toBeVisible();
});

test('Phase 2 U6 L3 separates six written eighths from their metric hierarchy', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto(lessonUrl);

  await expect(page.locator('h2').filter({ hasText: '1. Seis corcheas, dos mapas' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'La cantidad escrita puede ser la misma' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'AGRUPACIÓN ≠ COMPÁS' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'no estamos comparando dos velocidades distintas' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '5. Comparación A/B: cambiar el mapa, no los golpes' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'no tendrías evidencia suficiente para decidir cuál de las dos métricas se pretendía' })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});

test('Phase 2 U6 L3 keeps progression multidimensional and later-unit boundaries intact', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto(lessonUrl);

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L4' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'un BPM fijo o alto' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: '9/8 o 12/8 — U7' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'sextillos — U8' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5 — U9' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'gaps de metrónomo — U10' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'actualizar automáticamente D4 o F2' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
