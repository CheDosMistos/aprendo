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

test('Phase 2 U5 checkpoint renders its exclusive score and releases playback only after an attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/puerta-de-reorganizacion-del-pulso/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de reorganización del pulso' })).toBeVisible();
  await expect(page.getByText('¿C1–C3 y D3 permiten abrir U6', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u5/f2-u5-checkpoint-reorganizacion.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U5 checkpoint exposes a real two-pulse ternary auditory task with hidden answer', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/puerta-de-reorganizacion-del-pulso/');

  await expect(page.locator('h2').filter({ hasText: '2. Muestra B — microtarea auditiva ternaria' })).toBeVisible();
  const dictation = page.locator('.rhythm-dictation');
  await expect(dictation).toHaveCount(1);
  await expect(dictation.locator('[data-dictation-status]')).toContainText('2 pulsos');

  const answer = dictation.locator('[data-dictation-answer-text]');
  await expect(answer).toBeHidden();
  await dictation.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(answer).toBeVisible();
  await expect(answer).toContainText('X · X | · X X');
  await expect(answer).toContainText('dos pulsos ternarios');
});

test('Phase 2 U5 checkpoint separates subdivision from meter and keeps progression multidimensional', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/puerta-de-reorganizacion-del-pulso/');

  await expect(page.locator('h2').filter({ hasText: '3. Explicación conceptual' })).toBeVisible();
  await expect(page.getByText('PERMANECE:', { exact: true })).toBeVisible();
  await expect(page.getByText('CAMBIA:', { exact: true })).toBeVisible();
  await expect(page.getByText('tres por pulso no convierte automáticamente el compás en 6/8', { exact: false })).toBeVisible();
  await expect(page.getByText('no enseña todavía 6/8', { exact: false })).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA ABRIR U6' })).toBeVisible();
  await expect(page.getByText('un BPM fijo, universal o alto', { exact: false })).toBeVisible();
  await expect(page.getByText('primera vista formal D5', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente', { exact: false })).toBeVisible();

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    await expect(page.getByRole('heading', { level: 3, name: decision, exact: true })).toBeVisible();
  }

  await expect(page.getByText('compás compuesto I — 6/8 como organización métrica prototípica de dos pulsos principales con subdivisión ternaria', { exact: false })).toBeVisible();
});
