import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, { form: { username, password }, headers: { Origin: baseUrl }, maxRedirects: 0 });
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

test('U11 overview exposes both approved integration cycles and boundaries', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-11/');
  await expect(page.getByRole('heading', { level: 1, name: 'Integración: escuchar, escribir, leer y aplicar' })).toBeVisible();
  await expect(page.getByText('ESCUCHAR → ESCRIBIR → TOCAR → COMPARAR', { exact: true })).toBeVisible();
  await expect(page.getByText('VER → CONTAR/CANTAR → TOCAR → ESCUCHAR', { exact: true })).toBeVisible();
  await expect(page.getByText('5/4, 7/8, quintillos y 3:2 son sólo ventanas opcionales si el núcleo está estable;', { exact: true })).toBeVisible();
});

test('U11 L1 keeps auditory answers hidden before reveal', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-11/escuchar-escribir-tocar-comparar/');
  await expect(page.getByRole('heading', { level: 1, name: 'Escuchar → escribir → tocar → comparar' })).toBeVisible();
  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets).toHaveCount(2);
  await expect(widgets.nth(0)).toHaveAttribute('data-pattern', '10110100');
  await expect(widgets.nth(1)).toHaveAttribute('data-pattern', '11010110');
  for (let i = 0; i < 2; i += 1) {
    await expect(widgets.nth(i).getByRole('button', { name: 'Mostrar respuesta' })).toBeVisible();
    await expect(widgets.nth(i).locator('[data-dictation-answer-text]')).toBeHidden();
  }
  await widgets.nth(0).getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(widgets.nth(0).locator('[data-dictation-answer-text]')).toContainText('1 0 1 1 | 0 1 0 0');
});

test('U11 written cycle renders feedback-gated score and checkpoint preserves evidence limits', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-11/ver-contar-tocar-escuchar/');
  const score = page.locator('.course-score');
  await expect(score).toHaveCount(1);
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });

  await page.goto('/bateria/fase-2-unidad-11/puerta-integracion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de integración' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'INFERENCIA' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /EVIDENCIA A/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /EVIDENCIA B/ })).toBeVisible();
  const checkpointDictation = page.locator('.rhythm-dictation');
  await expect(checkpointDictation).toHaveCount(1);
  await expect(checkpointDictation).toHaveAttribute('data-pattern', '10011100');
  await expect(checkpointDictation.locator('[data-dictation-answer-text]')).toBeHidden();
  await expect(page.getByText(/Una muestra parcial sólo actualiza las habilidades realmente observadas/)).toBeVisible();
  await expect(page.getByText(/U12 comprobará el Hito 2/)).toBeVisible();
});
