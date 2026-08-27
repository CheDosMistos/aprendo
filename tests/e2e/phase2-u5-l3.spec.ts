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

test('Phase 2 U5 L3 renders the 2↔3↔4 score with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/2-3-4-reorganizar-densidad/');

  await expect(page.getByRole('heading', { level: 1, name: '2 ↔ 3 ↔ 4: reorganizar densidad' })).toBeVisible();
  await expect(page.getByText('MÁS ATAQUES DENTRO DEL PULSO NO SIGNIFICA MÁS TEMPO. EL PULSO SIGUE SIENDO LA REFERENCIA.', { exact: true })).toBeVisible();
  await expect(page.getByText('2, 3 y 4 cambian el reparto interior; las tres opciones ocupan exactamente el mismo pulso.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u5/f2-u5-l3-2-3-4.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U5 L3 keeps density, tempo, technique and later layers separated', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/2-3-4-reorganizar-densidad/');

  await expect(page.locator('h2').filter({ hasText: '4. De bloques previsibles a cambios menos predecibles' })).toBeVisible();
  await expect(page.getByText('2 | 3 | 4 | 3', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('C1 — PULSO:', { exact: true })).toBeVisible();
  await expect(page.getByText('C2/C3 — INTERIOR:', { exact: true })).toBeVisible();
  await expect(page.getByText('TÉCNICA:', { exact: true })).toBeVisible();
  await expect(page.getByText('reduce longitud o densidad antes de subir tempo', { exact: false })).toBeVisible();
  await expect(page.getByText('BPM es condición, no competencia', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L4' })).toBeVisible();
  await expect(page.getByText('No añadas sextillos', { exact: false })).toBeVisible();
  await expect(page.getByText('No uses click reducido ni gaps', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente C1, C2, C3, D3', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
