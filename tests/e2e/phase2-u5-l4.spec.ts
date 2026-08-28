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

test('Phase 2 U5 L4 renders the transfer score with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/oir-escribir-y-transferir-2-3-4/');

  await expect(page.getByRole('heading', { level: 1, name: 'Oír, escribir y transferir 2–3–4' })).toBeVisible();
  await expect(page.getByText('ESCUCHAR, IMITAR, ESCRIBIR Y LEER SON VÍAS DISTINTAS HACIA UNA MISMA ORGANIZACIÓN TEMPORAL.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u5/f2-u5-l4-transferencia.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U5 L4 connects ear imitation writing reading and transformation without claiming D5', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-5/oir-escribir-y-transferir-2-3-4/');

  await expect(page.locator('h2').filter({ hasText: '1. Oír e identificar' })).toBeVisible();
  await expect(page.getByText('E1 — PULSO:', { exact: true })).toBeVisible();
  await expect(page.getByText('E2 — SUBDIVISIÓN:', { exact: true })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '2. Escuchar → imitar' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. Escuchar → escribir' })).toBeVisible();
  await expect(page.getByText('ESCUCHA → REPRESENTACIÓN → NOTACIÓN → EJECUCIÓN → COMPARACIÓN', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Transformación A — 2 → 3' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Transformación B — 3 → 4' })).toBeVisible();
  await expect(page.getByText('No afirmes equivalencia de ataques:', { exact: false })).toBeVisible();
  await expect(page.getByText('no se registra como evidencia formal de primera vista D5', { exact: false })).toBeVisible();
  await expect(page.getByText('Esto no convierte 4/4 en 6/8.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR AL CHECKPOINT DE U5' })).toBeVisible();
  await expect(page.getByText('un BPM concreto o alto', { exact: false })).toBeVisible();
  await expect(page.getByText('pasen automáticamente a FUNCIONAL', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
