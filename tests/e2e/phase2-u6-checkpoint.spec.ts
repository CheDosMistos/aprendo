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
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('Phase 2 U6 checkpoint renders its exclusive 6/8 score and releases playback only after the attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/puerta-de-dos-pulsos-compuestos/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de dos pulsos compuestos' })).toBeVisible();
  await expect(page.getByText('¿D4/F2 y C1/C2 permiten abrir la siguiente ampliación del compás compuesto', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u6/f2-u6-checkpoint-dos-pulsos.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U6 checkpoint tests two compound beats across reading and listening without claiming E5 or D5', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/puerta-de-dos-pulsos-compuestos/');

  await expect(page.locator('h2').filter({ hasText: '1. Muestra principal — sentir y leer 6/8 como 2×3' })).toBeVisible();
  await expect(page.getByText('24 posiciones de corchea: 16 ataques y 8 silencios', { exact: false })).toBeVisible();
  await expect(page.getByText('tempo visible ♩. = 80', { exact: false })).toBeVisible();
  await expect(page.getByText('playback sólo después del intento propio', { exact: false })).toBeVisible();

  await expect(page.locator('h3').filter({ hasText: 'Comprobación auditiva sobre la misma muestra' })).toBeVisible();
  await expect(page.getByText('marca únicamente dos apoyos grandes por compás', { exact: false })).toBeVisible();
  await expect(page.getByText('no autoriza a declarar reconocimiento métrico general E5', { exact: false })).toBeVisible();
  await expect(page.getByText('Tampoco se registra esta tarea como primera vista formal D5', { exact: false })).toBeVisible();
});

test('Phase 2 U6 checkpoint preserves the approved conceptual boundaries and multidimensional gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/puerta-de-dos-pulsos-compuestos/');

  await expect(page.locator('h2').filter({ hasText: '2. Explicación conceptual' })).toBeVisible();
  await expect(page.getByText('6/8 prototípico:', { exact: false })).toContainText('2×3');
  await expect(page.getByText('3/4 prototípico del contraste:', { exact: false })).toContainText('3×2');
  await expect(page.getByText('Un tresillo dentro de otro marco simple expresa una relación de tuplet', { exact: false })).toBeVisible();
  await expect(page.locator('blockquote').filter({ hasText: 'AGRUPACIÓN ≠ COMPÁS' })).toHaveCount(1);

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA ABRIR U7' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'reconocimiento métrico general E5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: '9/8 o 12/8' })).toContainText('no se enseñan en esta puerta');
  await expect(page.getByText('no actualiza automáticamente', { exact: false })).toBeVisible();

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    await expect(page.getByRole('heading', { level: 3, name: decision, exact: true })).toBeVisible();
  }

  await expect(page.locator('h2').filter({ hasText: 'Puente a U7' })).toBeVisible();
  await expect(page.getByText('ampliar el modelo de compás compuesto', { exact: false })).toBeVisible();
});
