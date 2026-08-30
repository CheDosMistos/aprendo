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

async function expectPracticeCheckIn(page: Page): Promise<void> {
  const checkIn = page.getByLabel('Registrar esta práctica');
  await expect(checkIn.getByRole('heading', { name: 'Registrar esta práctica', exact: true })).toBeVisible();
}

test('F4 U1 overview exposes transfer principle and safe boundaries', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/');
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada al kit: ergonomía, seguridad y mapa de superficies' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/No reiniciar\. Transferir\./i).first()).toBeVisible();
  await expect(article.getByText(/U1 no enseña todavía groove, fills ni técnica específica de bombo o hi-hat/)).toBeVisible();
  await expect(article.getByText(/Nivel y duración importan desde la primera sesión con kit/)).toBeVisible();
  await expect(article.getByText(/No existe un ángulo universal de rodilla/)).toBeVisible();
});

test('F4 U1 L1 installs hearing safety before pedal technique', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/antes-primer-golpe/');
  await expect(page.getByRole('heading', { level: 1, name: 'Antes del primer golpe: contexto, seguridad y mapa funcional' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/nivel × duración × repetición de exposición/i)).toBeVisible();
  await expect(article.getByText(/Hoy no practicas técnica de pedal/)).toBeVisible();
  await expect(article.getByText(/no normalices tinnitus posterior/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U1 L2 uses one-variable observable ergonomics', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/asiento-equilibrio-alcance/');
  await expect(page.getByRole('heading', { level: 1, name: 'Asiento, equilibrio y alcance: configurar sin dogmas' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/PROBLEMA → CAMBIO → EFECTO/).first()).toBeVisible();
  await expect(article.getByText(/No se fijan centímetros, grados de rodilla ni alturas universales/)).toBeVisible();
  await expect(article.getByText(/Heel-up, heel-down y otras técnicas pertenecen a U3\/U4/)).toBeVisible();
  await expect(article.getByText(/cambia una sola variable de montaje/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U1 L3 compares surfaces without turning it into orchestration', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/escuchar-superficies/');
  await expect(page.getByRole('heading', { level: 1, name: 'Escuchar el kit: rebote, ataque y respuesta de superficies' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/LABORATORIO DE SUPERFICIES/)).toBeVisible();
  await expect(article.getByText(/misma célula completa en una superficie cada vez/i)).toBeVisible();
  await expect(article.getByText(/No hay BPM de aprobado/)).toBeVisible();
  await expect(article.getByText(/no dominio de orquestación/i)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
});

test('F4 U1 L4 performs zero transfer and diagnoses the bottleneck', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/transferencia-cero/');
  await expect(page.getByRole('heading', { level: 1, name: 'Transferencia cero: misma célula, nuevo instrumento' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/TRANSFERENCIA CERO/)).toBeVisible();
  await expect(article.getByText(/ACCESO \/ SUPERFICIE \/ MOVIMIENTO \/ TIEMPO/).first()).toBeVisible();
  await expect(article.getByText(/Todavía no alternes caja\/tom dentro de la misma frase/)).toBeVisible();
  await expect(article.getByText(/No demuestra todavía/)).toBeVisible();
  await expect(article.getByText(/H5 groove/)).toBeVisible();
});

test('F4 U1 checkpoint exposes H1 minimum and rejects hidden later requirements', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/kit-listo-transferir/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Kit listo para transferir' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'MÍNIMO PARA AVANZAR A U2' })).toBeVisible();
  await expect(article.getByText(/estrategia básica de escucha segura/)).toBeVisible();
  await expect(article.getByText(/célula manual ya conocida en caja y en otra superficie/)).toBeVisible();
  await expect(article.getByText(/H2 — técnica de bombo funcional/)).toBeVisible();
  await expect(article.getByText(/H5 — groove/)).toBeVisible();
  await expect(article.getByText(/No demuestra automáticamente H1 MÍNIMO/)).toBeVisible();
  await expect(article.getByText(/COMPETENTE no es requisito para entrar en U2/)).toBeVisible();
  await expect(page.locator('[data-posture-grader], [data-ergonomic-grader], [data-medical-grader], [data-hearing-grader]')).toHaveCount(0);
});

test('Phase 3 Hito 4 remains accessible after F4 U1 is added', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-12/hito-4-autor-ritmico/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hito 4 — Autor rítmico' })).toBeVisible();
  await expect(page.getByText(/Fase 4 — Transferencia al kit se activa cuando exista kit/)).toBeVisible();
});
