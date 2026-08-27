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

test('Phase 2 U5 L1 renders a 4/4 triplet study with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/tres-partes-dentro-del-mismo-pulso/');

  await expect(page.getByRole('heading', { level: 1, name: 'Tres partes dentro del mismo pulso' })).toBeVisible();
  await expect(page.getByText('TRES NOTAS DENTRO DEL PULSO NO SON TRES PULSOS.', { exact: true })).toBeVisible();
  await expect(page.getByText('Tresillo en 4/4 = tuplet dentro de métrica simple. No convierte el compás en 6/8.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u5/f2-u5-l1-tres-partes.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U5 L1 keeps pulse, ternary equality and later layers conceptually separate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/tres-partes-dentro-del-mismo-pulso/');

  await expect(page.locator('h2').filter({ hasText: '2. Sentir y cantar tres partes' })).toBeVisible();
  await expect(page.getByText('C1 — PULSO', { exact: false })).toBeVisible();
  await expect(page.getByText('IGUALDAD TERNARIA:', { exact: true })).toBeVisible();
  await expect(page.getByText('No vamos a entrenar todavía cambios 2↔3 como tarea central', { exact: false })).toBeVisible();
  await expect(page.getByText('No introduzcas todavía secuencias sistemáticas 2↔3, 2↔3↔4 ni 6/8.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L2' })).toBeVisible();
  await expect(page.getByText('un BPM concreto o alto', { exact: false })).toBeVisible();
  await expect(page.getByText('actualizar automáticamente C2 o D3', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
