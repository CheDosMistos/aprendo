import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function authenticate(page: Page, testInfo: TestInfo): Promise<void> {
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
    await page.goto('/');
    return;
  }

  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('critical auth and course navigation works end to end', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login\/$/);

  await authenticate(page, testInfo);
  await expect(page.getByRole('link', { name: 'Mi cuenta' })).toBeVisible();

  await page.goto('/bateria/unidad-1/');
  const firstSession = page.getByRole('link', { name: /Sesión 0/i });
  await expect(firstSession).toBeVisible();
  await firstSession.click();
  await expect(page).toHaveURL(/\/bateria\/unidad-1\/sesion-0-diagnostico\/$/);
});
