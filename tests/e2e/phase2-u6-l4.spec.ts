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

test('Phase 2 U6 L4 renders its transfer score and keeps playback behind self-attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/leer-escuchar-y-reinterpretar-sin-confundir-metrica/');

  await expect(page.getByRole('heading', { level: 1, name: 'Leer, escuchar y reinterpretar sin confundir métrica' })).toBeVisible();
  await expect(page.getByText('LA ESTRUCTURA DEBE SOBREVIVIR AL CAMBIO DE REPRESENTACIÓN.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u6/f2-u6-l4-transferencia-6-8.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U6 L4 transfers 6/8 from reading to listening without claiming general meter recognition', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/leer-escuchar-y-reinterpretar-sin-confundir-metrica/');

  await expect(page.locator('h2').filter({ hasText: '2. Leer una línea nueva accesible' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. Escuchar sin seguir cada símbolo' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: '¿puedo conservar 2×3 cuando la información llega por oído' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'no demuestra por sí sola reconocimiento métrico general ni E5 funcional' })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});

test('Phase 2 U6 L4 separates transformation and internal regrouping from meter change', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/leer-escuchar-y-reinterpretar-sin-confundir-metrica/');

  await expect(page.locator('h2').filter({ hasText: '4. Transformar sin cambiar el compás' })).toBeVisible();
  await expect(page.getByText('TRANSFORMAR LOS ATAQUES NO EQUIVALE A CAMBIAR LA MÉTRICA.', { exact: true })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '5. AMPLIACIÓN — reagrupación interna sin cambio métrico' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'métrica subyacente trabajada' })).toContainText('6/8');
  await expect(page.locator('li').filter({ hasText: 'agrupación/acento superpuesto' })).toContainText('2+2+2');
  await expect(page.getByText('AGRUPACIÓN ≠ COMPÁS', { exact: true }).first()).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A U6.CP' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5 — U9' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: '9/8 o 12/8 — U7' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'actualizar automáticamente D4, F2, E1, E2, G1 o G2' })).toBeVisible();
});
