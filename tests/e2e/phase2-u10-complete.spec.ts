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

test('Phase 2 U10 overview frames reduced click as conditional temporal difficulty', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-10/');
  await expect(page.getByRole('heading', { level: 1, name: 'Referencia temporal menos explícita' })).toBeVisible();
  await expect(page.getByText('VOLVER A REFERENCIA MÁS EXPLÍCITA ≠ FRACASAR', { exact: true })).toBeVisible();
  await expect(page.getByText('DECISIÓN CURRICULAR RAZONADA INFORMADA POR EVIDENCIA EXTRAPOLADA:', { exact: false })).toBeVisible();
});

test('U10 lesson exposes the four reference modes in the compact metronome and renders controlled notation', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-10/de-cada-pulso-a-2-y-4/');
  await expect(page.getByRole('heading', { level: 1, name: 'De cada pulso a 2 y 4' })).toBeVisible();

  const reference = page.getByLabel('Densidad de referencia del metrónomo');
  await expect(reference).toBeVisible();
  await expect(reference.locator('option')).toHaveCount(4);
  await reference.selectOption('two-four');
  await expect(reference).toHaveValue('two-four');
  await reference.selectOption('half-time');
  await expect(reference).toHaveValue('half-time');
  await reference.selectOption('gap-one-bar');
  await expect(reference).toHaveValue('gap-one-bar');

  const score = page.locator('.course-score');
  await expect(score).toHaveCount(1);
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
});

test('U10 reduced modes are disabled outside 4/4 and checkpoint preserves decision language', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-10/gap-un-compas-con-un-compas-sin/');
  const meter = page.getByLabel('Compás', { exact: true });
  const reference = page.getByLabel('Densidad de referencia del metrónomo');
  await reference.selectOption('gap-one-bar');
  await meter.selectOption('6/8');
  await expect(reference).toHaveValue('all');
  await expect(reference.locator('option[value="two-four"]')).toBeDisabled();
  await expect(reference.locator('option[value="half-time"]')).toBeDisabled();
  await expect(reference.locator('option[value="gap-one-bar"]')).toBeDisabled();

  await page.goto('/bateria/fase-2-unidad-10/puerta-referencia-interna-inicial/');
  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de referencia interna inicial' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'INFERENCIA' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'EVIDENCIA' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'DECISIÓN' })).toBeVisible();
  await expect(page.getByText('Completar el checkpoint no convierte C5 en FUNCIONAL.', { exact: false })).toBeVisible();
});
