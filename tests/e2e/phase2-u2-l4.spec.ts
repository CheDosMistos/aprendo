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
      name: 'aprendo_session',
      value: match![1],
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
    }]);
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('Phase 2 U2 L4 renders protected retrieval and the original doubles-diddles score', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/doubles-diddles-sin-alterar-la-linea/');

  await expect(page.getByRole('heading', { level: 1, name: 'Doubles/diddles sin alterar la línea' })).toBeVisible();
  await expect(page.getByText('La línea rítmica manda', { exact: false }).first()).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const recovery = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(recovery).toHaveCount(1);
  await expect(recovery.locator('.course-score__play')).toBeHidden();
  const enableAudio = recovery.getByRole('button', { name: 'Habilitar audio' });
  await expect(enableAudio).toBeVisible();
  await enableAudio.click();
  await expect(recovery).toHaveAttribute('data-feedback-locked', 'false');
  await expect(recovery.locator('.course-score__play')).toBeVisible();

  const application = page.locator('.course-score').filter({
    has: page.locator('a[href="/bateria/notation/f2/u2/f2-u2-linea-doubles-diddles.musicxml"]'),
  });
  await expect(application).toHaveCount(1);
  await expect(application.locator('.course-score__shell')).toBeVisible();
  await expect(application.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u2/f2-u2-linea-doubles-diddles.musicxml');
  await expect(application).not.toHaveAttribute('data-score-first-sight', 'true');
});

test('Phase 2 U2 L4 preserves rhythm before sticking and keeps 5+5+6 optional inside 4/4', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/doubles-diddles-sin-alterar-la-linea/');

  await expect(page.locator('h2').filter({ hasText: '2. Decodificación base' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. Aplicación' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '4. Transferencia' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: 'Ventana AVANZADO opcional' })).toBeVisible();

  await expect(page.getByText('dos ataques consecutivos que ya existen en la partitura', { exact: false })).toBeVisible();
  await expect(page.getByText('no duplica un ataque único', { exact: false })).toBeVisible();
  await expect(page.getByText('agrupación interna mediante acentos', { exact: false })).toBeVisible();
  await expect(page.getByText('no es polimetría', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige un BPM concreto', { exact: false })).toBeVisible();
  await expect(page.getByText('no declara B7 FUNCIONAL de forma global', { exact: false })).toBeVisible();
  await expect(page.getByText('checkpoint de U2 — Puerta de semicorcheas y silencios', { exact: false })).toBeVisible();
});
