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

test('Phase 2 U4 L1 renders syncopation II and keeps both scores behind the feedback gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/sincopa-ii-mas-combinaciones-mismo-marco/');

  await expect(page.getByRole('heading', { level: 1, name: 'Síncopa II: más combinaciones, mismo marco' })).toBeVisible();
  await expect(page.getByText('Más variedad no significa más capas', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);
  const locked = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(locked).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    await expect(locked.nth(index).locator('.course-score__play')).toBeHidden();
    await expect(locked.nth(index).getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  }

  const newScore = page.locator('.course-score').filter({
    has: page.locator('a[href="/bateria/notation/f2/u4/f2-u4-l1-sincopa-ii.musicxml"]'),
  });
  await expect(newScore).toHaveCount(1);
  await expect(newScore.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u4/f2-u4-l1-sincopa-ii.musicxml');
  await newScore.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(newScore).toHaveAttribute('data-feedback-locked', 'false');
  await expect(newScore.locator('.course-score__play')).toBeVisible();
});

test('Phase 2 U4 L1 exposes positional variety, recovery and preserves L2/L3 as later layers', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/sincopa-ii-mas-combinaciones-mismo-marco/');

  await expect(page.locator('h2').filter({ hasText: '2. NÚCLEO' })).toBeVisible();
  await expect(page.getByText('no llamamos “síncopa” automáticamente a cualquier offbeat aislado', { exact: false })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. Continuidad y recuperación' })).toBeVisible();
  await expect(page.getByText('analiza después si el problema fue decodificación o pérdida temporal', { exact: false })).toBeVisible();
  await expect(page.getByText('No transformes todavía el acento ni el sticking', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige cero errores, un BPM concreto', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente', { exact: false })).toBeVisible();
  await expect(page.getByText('la misma línea, otro acento', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
