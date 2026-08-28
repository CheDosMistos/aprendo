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

test('Phase 2 U5 L2 renders the 2↔3 score and keeps playback behind the attempt gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/binario-ternario-el-pulso-no-se-mueve/');

  await expect(page.getByRole('heading', { level: 1, name: 'Binario ↔ ternario: el pulso no se mueve' })).toBeVisible();
  await expect(page.getByText('EL PULSO CONTINÚA. CAMBIA 2 ↔ 3; NO CAMBIA EL TEMPO.', { exact: true })).toBeVisible();
  await expect(page.getByText('CAMBIO DE SUBDIVISIÓN ≠ CAMBIO DE TEMPO.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u5/f2-u5-l2-binario-ternario.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U5 L2 separates pulse from subdivision and exposes bounded binary/ternary hearing', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/binario-ternario-el-pulso-no-se-mueve/');

  await expect(page.locator('h2').filter({ hasText: '2. Dos organizaciones, un mismo pulso' })).toBeVisible();
  await expect(page.getByText('PULSO:', { exact: true })).toBeVisible();
  await expect(page.getByText('SUBDIVISIÓN:', { exact: true })).toBeVisible();
  await expect(page.getByText('2 ↔ 3 ↔ 4 pertenece a L3', { exact: false })).toBeVisible();
  await expect(page.getByText('U6 trabaja el compás compuesto', { exact: false })).toBeVisible();

  const dictations = page.locator('.rhythm-dictation');
  await expect(dictations).toHaveCount(2);
  for (const dictation of await dictations.all()) {
    await expect(dictation.getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();
    await expect(dictation.getByRole('button', { name: 'Mostrar respuesta' })).toBeVisible();
    await expect(dictation.locator('[data-dictation-answer-text]')).toBeHidden();
  }

  await dictations.first().getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(dictations.first().locator('[data-dictation-answer-text]')).toContainText('BINARIA');
  await expect(dictations.nth(1).locator('[data-dictation-answer-text]')).toBeHidden();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L3' })).toBeVisible();
  await expect(page.getByText('BPM no es competencia', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente C2, C3, D3', { exact: false })).toBeVisible();
});
