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

async function expectProtectedFirstSight(page: Page): Promise<void> {
  const score = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(score).toBeVisible();
  const shell = score.locator('.course-score__shell');
  const play = score.locator('.course-score__play');

  await expect(shell).toHaveAttribute('aria-hidden', 'true');
  await expect(play).toBeHidden();
  await expect(score.getByRole('button', { name: 'Empezar' })).toBeVisible();

  await score.getByRole('button', { name: 'Empezar' }).click();
  await expect(score).toHaveAttribute('data-first-sight-started', 'true');
  await expect(shell).toHaveAttribute('aria-hidden', 'false');
  await expect(play).toBeHidden();
  await expect(score.getByRole('button', { name: 'Finalizar intento' })).toBeVisible();

  await score.getByRole('button', { name: 'Finalizar intento' }).click();
  await expect(score).toHaveAttribute('data-first-sight-completed', 'true');
  await expect(score.getByRole('button', { name: 'Ocultar' })).toBeVisible();
  await expect(play).toBeVisible();
}

test('first-sight score keeps notation hidden before start and playback locked through the first attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/cierre-unidad-1/');
  await expectProtectedFirstSight(page);
});

test('Phase 2 U1 L1 publishes on its phase-safe route with protected entry reading', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/punto-real-de-entrada/');
  await expect(page.getByRole('heading', { level: 1, name: 'Punto real de entrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toBeVisible();
  await expectProtectedFirstSight(page);
});
