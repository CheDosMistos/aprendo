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

test('Phase 2 U7 L4 renders compound transfer notation and five hidden-answer aural widgets', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/leer-escuchar-clasificar-y-explicar/');

  await expect(page.getByRole('heading', { level: 1, name: 'Leer, escuchar, clasificar y explicar' })).toBeVisible();
  await expect(page.getByText('E5 EMPIEZA AQUÍ COMO RECONOCIMIENTO CONTROLADO, NO COMO ADIVINACIÓN DE COMPASES EN MÚSICA AMBIGUA.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente de la transferencia 6/8–9/8–12/8' })).toHaveAttribute('href', '/bateria/notation/f2/u7/f2-u7-l4-transfer-6-8-9-8-12-8.musicxml');

  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets).toHaveCount(5);
  for (let i = 0; i < 5; i += 1) {
    await expect(widgets.nth(i).getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();
    await expect(widgets.nth(i).getByRole('button', { name: 'Mostrar respuesta' })).toBeVisible();
    await expect(widgets.nth(i).locator('[data-dictation-answer-text]')).toBeHidden();
  }
});

test('Phase 2 U7 L4 encodes A/B as equal six attacks with different pulse subdivision', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/leer-escuchar-clasificar-y-explicar/');

  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets.nth(0)).toHaveAttribute('data-subdivision', '3');
  await expect(widgets.nth(0)).toHaveAttribute('data-pattern', '111111');
  await expect(widgets.nth(1)).toHaveAttribute('data-subdivision', '2');
  await expect(widgets.nth(1)).toHaveAttribute('data-pattern', '111111');

  await widgets.nth(0).getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(widgets.nth(0).locator('[data-dictation-answer-text]')).toHaveText('6/8 prototípico — 2 pulsos principales × 3 subdivisiones: compuesto.');
  await expect(widgets.nth(0).getByRole('button', { name: 'Ocultar respuesta' })).toBeVisible();

  await expect(page.getByText('A y B contienen seis ataques regulares, pero no duran el mismo número de pulsos principales después del count-in:', { exact: true })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'en A, seis posiciones ocupan' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'en B, seis posiciones ocupan' })).toBeVisible();
});

test('Phase 2 U7 L4 keeps E5 bounded and exposes checkpoint criteria', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/leer-escuchar-clasificar-y-explicar/');

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA PASAR AL CHECKPOINT DE U7' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'reconocimiento métrico general en repertorio ambiguo' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'sextillos' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'click reducido, half-time o gaps' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
