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

const approvedHito = /Crear, escribir, tocar y explicar una breve pieza rítmica propia empleando desarrollo motívico y al menos una transformación consciente/;

test('U12 overview preserves Hito 4 and keeps odd meter optional', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/');
  await expect(page.getByRole('heading', { level: 1, name: 'Integración y Hito de Fase' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(approvedHito)).toBeVisible();
  await expect(article.getByText(/4\/4, 5\/4 y 7\/8 son opciones válidas/)).toBeVisible();
  await expect(article.getByText(/la métrica impar no es requisito del Hito/)).toBeVisible();
  await expect(article.getByText(/Hito global 3[\s\S]*ya tuvo su checkpoint en U4/)).toBeVisible();
});

test('U12 L1 defines a bounded brief and uses the existing practice check-in', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/brief-final/');
  const article = page.locator('article.course-article');
  await expect(page.getByRole('heading', { level: 1, name: 'Brief final: elegir qué quieres demostrar' })).toBeVisible();
  await expect(article.getByText(/1–4 compases pueden bastar/)).toBeVisible();
  await expect(article.getByText(/4\/4 puede demostrar perfectamente el Hito/)).toBeVisible();
  await expect(article.getByText(/transformación conocida/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Registrar esta práctica' })).toBeVisible();
  await expect(page.getByText(/Completar esta sesión no demuestra automáticamente todas las competencias/)).toBeVisible();
});

test('U12 L2 requires own V0 and traceable development without a notation solution', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/pieza-candidata-v0/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/No existe una partitura-solución del curso/)).toBeVisible();
  await expect(article.getByText(/SE CONSERVA →/)).toBeVisible();
  await expect(article.getByText(/CAMBIA →/)).toBeVisible();
  await expect(article.getByText(/V0/).first()).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expect(page.locator('[data-creativity-grader], [data-composition-grader], [data-hito-grader]')).toHaveCount(0);
});

test('U12 L3 separates intention, representation and execution and preserves V0', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/auditoria-autonoma-v0-v1/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Conserva V0/).first()).toBeVisible();
  await expect(article.getByRole('heading', { name: 'INTENCIÓN', exact: true })).toBeVisible();
  await expect(article.getByRole('heading', { name: 'REPRESENTACIÓN', exact: true })).toBeVisible();
  await expect(article.getByRole('heading', { name: 'EJECUCIÓN', exact: true })).toBeVisible();
  await expect(article.getByText(/V1 sólo existe si cambias deliberadamente/)).toBeVisible();
  await expect(article.getByText(/mantener V0 porque no existe razón suficiente/)).toBeVisible();
  await expect(article.getByText(/Registrar una ayuda no invalida la toma/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Registrar esta práctica' })).toBeVisible();
});

test('U12 L4 rehearses ear-write-execute evidence and rejects checklist-as-competence', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/ensayo-hito/');
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: /Oído ↔ escritura ↔ ejecución/ })).toBeVisible();
  await expect(article.getByText(/SE CONSERVA →/)).toBeVisible();
  await expect(article.getByText(/CAMBIA →/)).toBeVisible();
  await expect(article.getByText(/pieza propia representada por escrito/)).toBeVisible();
  await expect(article.getByText(/marcar casillas no demuestra por sí solo la competencia/)).toBeVisible();
  await expect(page.locator('[data-creativity-grader], [data-composition-grader], [data-hito-grader]')).toHaveCount(0);
});

test('U12 Hito 4 exposes the approved minimum without perfection or hidden odd-meter requirements', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/hito-4-autor-ritmico/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hito 4 — Autor rítmico' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(approvedHito)).toBeVisible();
  await expect(article.getByRole('heading', { name: 'MÍNIMO — HITO 4 ALCANZADO' })).toBeVisible();
  await expect(article.getByText(/No se exige BPM alto, cero errores, métrica impar, varias transformaciones, kit ni originalidad excepcional/)).toBeVisible();
  await expect(article.getByText(/COMPETENTE no es requisito para reconocer el Hito mínimo/)).toBeVisible();
  await expect(article.getByText(/Pulsar “Cierre registrado” no demuestra automáticamente el Hito/)).toBeVisible();
  await expect(page.getByLabel('Cierre registrado')).toBeVisible();
  await expect(page.getByLabel('Cierre con pendientes identificados')).toBeVisible();
  await expect(page.getByLabel('Necesito revisar antes de cerrar')).toBeVisible();
});

test('U12 Hito keeps Phase 4 conditional on kit and does not create a solution score or grader', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/hito-4-autor-ritmico/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Fase 4 — Transferencia al kit se activa cuando exista kit/)).toBeVisible();
  await expect(article.getByText(/Mientras sólo haya pad/)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expect(page.locator('[data-creativity-grader], [data-composition-grader], [data-hito-grader]')).toHaveCount(0);
});

test('U11 checkpoint remains intact when U12 is added', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/ficha-analisis-integrado/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Ficha de análisis integrado' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MÍNIMO PARA AVANZAR A U12' })).toBeVisible();
  await expect(page.locator('.musical-context')).toHaveCount(1);
});
