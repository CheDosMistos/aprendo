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

test('Phase 2 U1 L2 renders readable notation and hearing choices without first-sight locking', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/fluidez-binaria-sin-memorizar-dibujos/');

  await expect(page.getByRole('heading', { level: 1, name: 'Fluidez binaria sin memorizar dibujos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MusicXML — fuente del ejercicio' }).last()).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);
  const l2Score = scores.last();
  await expect(l2Score).toBeVisible();
  await expect(l2Score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(l2Score.locator('.course-score__shell')).toBeVisible();

  const dictations = page.locator('.rhythm-dictation');
  await expect(dictations).toHaveCount(2);
  const first = dictations.first();
  const answer = 'Opción A — ataques en 1, 2, & de 2 y & de 3; es menos densa que la opción B.';
  await expect(first.getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();
  await expect(first.getByText(answer)).toBeHidden();
  await first.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(first.getByText(answer)).toBeVisible();
});
