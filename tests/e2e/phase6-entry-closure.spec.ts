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

test('F6 entry exposes the bounded longitudinal layer without recertifying Hito 6', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-6-unidad-1/');
  await expect(page.getByRole('heading', { level: 1, name: 'Reentrada desde Hito 6, diagnóstico y portafolio' })).toBeVisible();

  const article = page.locator('article.course-article');
  await expect(article.getByText(/no vuelve a examinar el Hito 6/i)).toBeVisible();

  const longitudinal = page.locator('[data-phase6-longitudinal]');
  await expect(longitudinal).toBeVisible();
  await expect(longitudinal.getByRole('heading', { name: /Construye autonomía sin convertir cada competencia avanzada en una deuda de práctica/i })).toBeVisible();
  await expect(longitudinal.getByText(/Portafolio ≠ cuatro rutinas simultáneas/i)).toBeVisible();
  await expect(longitudinal.getByText(/Autonomía ≠ practicar sin ayuda/i)).toBeVisible();
  await expect(longitudinal.getByText(/Sustituir, no añadir/i)).toBeVisible();
});

test('F6 closure preserves the specific phase objective and Hito 7 boundaries', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-6-unidad-12/');
  await expect(page.getByRole('heading', { level: 1, name: 'Integración, portafolio y Hito 7' })).toBeVisible();

  const article = page.locator('article.course-article');
  await expect(article.getByText(/Aprender una pieza al menos parcialmente mediante escucha, transcripción y análisis/i)).toBeVisible();
  await expect(article.getByText(/No hace falta que todas alcancen nivel AVANZADO/i)).toBeVisible();
  await expect(page.locator('[data-phase6-longitudinal]')).toBeVisible();
});

test('F6 final checkpoint requires integrated evidence without universal advanced level', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-6-unidad-12/checkpoint-hito-7-cierre-fase-6/');
  await expect(page.getByRole('heading', { level: 1, name: 'Evaluación — Cierre de Fase 6 y Hito 7' })).toBeVisible();

  const article = page.locator('article.course-article');
  await expect(article.getByText(/OBJETIVO ESPECÍFICO DE FASE 6: CUMPLIDO/i)).toBeVisible();
  await expect(article.getByText(/No se exige una prueba aislada para cada componente ni nivel avanzado universal/i)).toBeVisible();
  await expect(article.getByText(/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/i)).toBeVisible();
  await expect(article.getByText(/AVANZADO NO ES REQUISITO PARA CERRAR FASE 6/i)).toBeVisible();
  await expect(article.getByText(/no crea una lista paralela de todas las competencias de Fase 6/i)).toBeVisible();
});
