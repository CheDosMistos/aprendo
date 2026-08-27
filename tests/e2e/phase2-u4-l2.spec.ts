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

test('Phase 2 U4 L2 renders the same line with accent as a gated expressive layer', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/la-misma-linea-otro-acento/');

  await expect(page.getByRole('heading', { level: 1, name: 'La misma línea, otro acento' })).toBeVisible();
  await expect(page.getByText('CAMBIAR EL ACENTO NO CAMBIA EL RITMO', { exact: false })).toBeVisible();
  await expect(page.locator('.course-score')).toHaveCount(2);
  await expect(page.locator('.course-score[data-score-feedback="after-attempt"]')).toHaveCount(2);

  const accentScore = page.locator('.course-score').filter({ has: page.locator('a[href="/bateria/notation/f2/u4/f2-u4-l2-acentos.musicxml"]') });
  await expect(accentScore).toHaveCount(1);
  await expect(accentScore.locator('.course-score__play')).toBeHidden();
  await accentScore.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(accentScore.locator('.course-score__play')).toBeVisible();
  await expect(accentScore.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u4/f2-u4-l2-acentos.musicxml');
});

test('Phase 2 U4 L2 distinguishes timing from dynamics and reserves B7 for L3', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/la-misma-linea-otro-acento/');

  await expect(page.getByText('mapa temporal', { exact: false })).toBeVisible();
  await expect(page.getByText('mapa dinámico', { exact: false })).toBeVisible();
  await expect(page.getByText('acento no significa golpear al máximo', { exact: false })).toBeVisible();
  await expect(page.getByText('error temporal', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('error dinámico', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('No añadas paradiddle, doubles ni otra textura de manos', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige cero errores, gran volumen, un BPM concreto', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente', { exact: false })).toBeVisible();
  await expect(page.getByText('la línea manda: aplicación B7 sobre lectura conocida', { exact: false })).toBeVisible();
});
