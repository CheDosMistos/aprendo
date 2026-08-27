import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, {
      form: { username, password }, headers: { Origin: baseUrl }, maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    const match = /(?:^|,\s*)aprendo_session=([^;]+)/i.exec(response.headers()['set-cookie'] ?? '');
    expect(match?.[1]).toBeTruthy();
    const url = new URL(baseUrl);
    await page.context().addCookies([{ name: 'aprendo_session', value: match![1], domain: url.hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Strict' }]);
    return;
  }
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('Phase 2 U4 L4 protects its exclusive new line until one first attempt is completed', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/leer-seguir-y-recuperarse/');

  await expect(page.getByRole('heading', { level: 1, name: 'Leer, seguir y recuperarse' })).toBeVisible();
  await expect(page.getByText('UN ERROR LOCAL NO OBLIGA A PERDER EL COMPÁS', { exact: false })).toBeVisible();

  const firstSight = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(firstSight).toHaveCount(1);
  await expect(firstSight.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'true');
  await expect(firstSight.locator('.course-score__play')).toBeHidden();
  await expect(firstSight.getByRole('button', { name: 'Empezar' })).toBeVisible();

  await firstSight.getByRole('button', { name: 'Empezar' }).click();
  await expect(firstSight.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'false');
  await expect(firstSight.locator('.course-score__play')).toBeHidden();
  await expect(firstSight.getByRole('button', { name: 'Finalizar intento' })).toBeVisible();

  await firstSight.getByRole('button', { name: 'Finalizar intento' }).click();
  await expect(firstSight).toHaveAttribute('data-first-sight-completed', 'true');
  await expect(firstSight.locator('.course-score__play')).toBeVisible();
  await expect(firstSight.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u4/f2-u4-l4-lectura-nueva.musicxml');
});

test('Phase 2 U4 L4 separates precision continuity and recovery and does not turn D5 into the U4 target', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/leer-seguir-y-recuperarse/');

  await expect(page.getByText('No convierte todavía D5 — primera vista en competencia dominante', { exact: false })).toBeVisible();
  await expect(page.getByText('U9 reservará el protocolo sistemático de primera vista', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '3. Diagnóstico: precisión ≠ continuidad ≠ recuperación — 4–5 min' })).toBeVisible();
  await expect(page.getByText('no reinicies por defecto', { exact: false })).toBeVisible();
  await expect(page.getByText('Cualquier repetición posterior es relectura/práctica', { exact: false })).toBeVisible();
  await expect(page.getByText('Continuar primero no significa ignorar precisión para siempre', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR AL CHECKPOINT DE U4' })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente competencias', { exact: false })).toBeVisible();
  await expect(page.getByText('otra muestra exclusiva', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
