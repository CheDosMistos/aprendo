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

test('Phase 2 U1 L3 renders the understood score and PAS normative source without first-sight locking', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/aplicacion-rudimental-sin-perder-la-linea/');

  await expect(page.getByRole('heading', { level: 1, name: 'Aplicación rudimental sin perder la línea' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'PAS — International Drum Rudiments (PDF oficial)' })).toHaveAttribute('href', 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf');
  await expect(page.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toBeVisible();
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__shell')).toBeVisible();

  await expect(page.getByText('la lectura manda; el rudimento es una textura posible', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '3. Aplicación — 8–10 min' })).toBeVisible();
  await expect(page.getByText('No añadas golpes entre notas.', { exact: false })).toBeVisible();
  await expect(page.getByText('volver a sticking simple no es fracaso de D1', { exact: false })).toBeVisible();
});
