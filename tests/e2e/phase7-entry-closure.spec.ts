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

test('F7 entry exposes the longitudinal rule without turning advanced rhythm into practice debt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-7-unidad-1/');
  await expect(page.getByRole('heading', { level: 1, name: 'Agrupaciones dentro de 4/4' })).toBeVisible();

  const longitudinal = page.locator('[data-phase7-longitudinal]');
  await expect(longitudinal).toBeVisible();
  await expect(longitudinal.getByRole('heading', { name: /Ritmo avanzado sin convertir la complejidad en deuda de práctica/i })).toBeVisible();
  await expect(longitudinal.getByText(/Secuencia de profundidad ≠ nueve rutinas/i)).toBeVisible();
  await expect(longitudinal.getByText(/Puerta relevante, no lista completa/i)).toBeVisible();
});

test('F7 final overview preserves Hito 8 as explanation, reference, execution and application', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-7-unidad-9/');
  await expect(page.getByRole('heading', { level: 1, name: 'Integración progresiva y experimentación' })).toBeVisible();

  const article = page.locator('article.course-article');
  await expect(article.getByText(/explicación \+ pulso \+ ejecución \+ aplicación/i)).toBeVisible();
  await expect(article.getByText(/Hito 8 puede demostrarse con una selección adecuada de recursos/i)).toBeVisible();
  await expect(page.locator('[data-phase7-longitudinal]')).toBeVisible();
});

test('F7 final checkpoint does not create eight maintenance routines', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-7-unidad-9/checkpoint-7i/');
  await expect(page.getByRole('heading', { level: 1, name: 'Evaluación — Integración progresiva y Hito 8' })).toBeVisible();

  const article = page.locator('article.course-article');
  await expect(article.getByText(/no es un examen acumulativo de ocho técnicas ni una lista de ocho rutinas de mantenimiento/i)).toBeVisible();
  await expect(article.getByText(/mapa de estado/i)).toBeVisible();
  await expect(article.getByText(/salen de la prioridad dominante/i)).toBeVisible();
});
