import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  test.skip(!username || !password, 'E2E credentials are required for authenticated course routes.');

  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, {
      form: { username: username!, password: password! },
      headers: { Origin: baseUrl },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    const match = /(?:^|,\s*)aprendo_session=([^;]+)/i.exec(response.headers()['set-cookie'] ?? '');
    expect(match?.[1]).toBeTruthy();
    const url = new URL(baseUrl);
    await page.context().addCookies([{ name: 'aprendo_session', value: match![1], domain: url.hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Strict' }]);
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username!);
  await page.getByLabel('Contraseña').fill(password!);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('course home exposes the optional specialization appendix and its seven trajectories', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/');

  const callout = page.locator('[data-specializations-callout]');
  await expect(callout).toContainText('Trayectorias de especialización');
  await callout.getByRole('link', { name: 'Explorar trayectorias' }).click();

  await expect(page).toHaveURL(`${baseUrl}/bateria/trayectorias/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Trayectorias de especialización' })).toBeVisible();
  await expect(page.getByText('No necesitas terminar el curso para explorar una trayectoria')).toBeVisible();
  await expect(page.locator('[data-track-id]')).toHaveCount(7);
  await expect(page.locator('[data-core-progressive-route]')).toContainText('TRONCAL AVANZADO');
  await expect(page.getByText('PUEDES EXPLORARLA YA').first()).toBeVisible();
  await expect(page.getByText('INICIO PARALELO RAZONABLE').first()).toBeVisible();
  await expect(page.getByText('ESPECIALIZACIÓN SERIA').first()).toBeVisible();
});
