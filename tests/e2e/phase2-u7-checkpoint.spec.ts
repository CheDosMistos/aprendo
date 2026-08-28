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

test('Phase 2 U7 checkpoint renders exclusive notation and four hidden-answer aural stimuli', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/puerta-generalizacion-compuesta/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de generalización compuesta' })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente de la muestra escrita del checkpoint' })).toHaveAttribute('href', '/bateria/notation/f2/u7/f2-u7-checkpoint-generalizacion-compuesta.musicxml');

  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets).toHaveCount(4);
  for (let i = 0; i < 4; i += 1) {
    await expect(widgets.nth(i).getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();
    await expect(widgets.nth(i).getByRole('button', { name: 'Mostrar respuesta' })).toBeVisible();
    await expect(widgets.nth(i).locator('[data-dictation-answer-text]')).toBeHidden();
  }
});

test('Phase 2 U7 checkpoint A/B isolates 2x3 versus 3x2 with the same six-position pattern', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/puerta-generalizacion-compuesta/');

  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets.nth(0)).toHaveAttribute('data-pattern', '101110');
  await expect(widgets.nth(0)).toHaveAttribute('data-subdivision', '3');
  await expect(widgets.nth(1)).toHaveAttribute('data-pattern', '101110');
  await expect(widgets.nth(1)).toHaveAttribute('data-subdivision', '2');

  await widgets.nth(1).getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(widgets.nth(1).locator('[data-dictation-answer-text]')).toHaveText('3/4 prototípico — 3 pulsos principales × 2 subdivisiones: simple.');
  await expect(page.getByText('A y B vuelven a usar el mismo patrón de seis posiciones, pero el count-in establece una relación distinta entre posiciones y pulso principal.', { exact: true })).toBeVisible();
});

test('Phase 2 U7 checkpoint exposes all four decisions and keeps U8 novelty outside the gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/puerta-generalizacion-compuesta/');

  await expect(page.getByRole('heading', { level: 3, name: 'CONTINUAR', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'CONTINUAR + CORRECTIVO', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'REDUCIR NOVEDAD', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'DETENER CARGA', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA ABRIR U8' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'sextillos u ornamentación escrita' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'click reducido, half-time o gaps' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
