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

async function expectScoresReady(page: Page, count = 1): Promise<void> {
  const scores = page.locator('article.course-article [data-notation-score]');
  await expect(scores).toHaveCount(count);
  for (let index = 0; index < count; index += 1) {
    const score = scores.nth(index);
    await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 20_000 });
    await expect(score.getByRole('button', { name: 'Reproducir partitura' })).toBeEnabled();
  }
}

async function expectNoScores(page: Page): Promise<void> {
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(0);
}

async function expectPracticeCheckIn(page: Page): Promise<void> {
  const checkIn = page.getByLabel('Registrar esta práctica');
  await expect(checkIn.getByRole('heading', { name: 'Registrar esta práctica', exact: true })).toBeVisible();
}

test('F5 U2 overview makes D7 navigation dominant and exposes Chart A', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/');
  await expect(page.getByRole('heading', { level: 1, name: 'Charts, navegación y prioridades' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: D7/i)).toBeVisible();
  await expect(article.getByText(/UN CHART NO TE DICE CADA GOLPE/i)).toBeVisible();
  await expect(article.getByText(/TIEMPO → FORMA → ENTRADA → FIGURE\/CUE → DETALLE/i)).toBeVisible();
  await expect(article.getByText(/puede certificar D7 MÍNIMO en condición preparada/i)).toBeVisible();
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F5 U2 L1 renders only the reused U1 score and compares it with Chart A', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/partitura-vs-chart/');
  await expect(page.getByRole('heading', { level: 1, name: 'Partitura completa vs. chart' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/esqueleto formal mínimo/i)).toBeVisible();
  await expect(article.getByText(/El chart no dicta/i)).toBeVisible();
  await expect(article.getByText(/TIEMPO → FORMA → ENTRADA → DETALLE/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U2 L2 navigates form and dynamics without a score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/forma-entradas-dinamica/');
  await expect(page.getByRole('heading', { level: 1, name: 'Forma, entradas y dinámica' })).toBeVisible();
  await expectNoScores(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/SECCIÓN ACTUAL → SIGUIENTE SECCIÓN → EVENTO QUE DEBO ANTICIPAR/i)).toBeVisible();
  await expect(article.getByText(/Más fuerte no significa más tenso ni más rápido/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U2 L3 integrates known cues and prioritizes continuation', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/cues-conocidos/');
  await expect(page.getByRole('heading', { level: 1, name: 'Figure y cue conocidos sin dejar de tocar' })).toBeVisible();
  await expectNoScores(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByRole('cell', { name: /Compás 12: Fill A/i })).toBeVisible();
  await expect(article.getByRole('cell', { name: /Compás 16: Variación B/i })).toBeVisible();
  await expect(article.getByText(/GROOVE → ANTICIPAR → EVENTO CONOCIDO → CONTINUAR/i)).toBeVisible();
  await expect(article.getByText(/No inventes un fill más difícil/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U2 L4 uses Chart A only and teaches recovery', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/navegacion-chart-recuperacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Navegación con información reducida y recuperación' })).toBeVisible();
  await expectNoScores(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/sólo Chart A como ayuda escrita principal/i)).toBeVisible();
  await expect(article.getByText(/PERDER UN DETALLE NO OBLIGA A PERDER LA PIEZA/i)).toBeVisible();
  await expect(article.getByText(/SÍNTOMA → HIPÓTESIS → PRUEBA → CORRECCIÓN → RECOMPONER/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U2 checkpoint 5A certifies D7 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/d7-minimo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint 5A — D7 MÍNIMO' })).toBeVisible();
  await expectNoScores(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/D7 MÍNIMO en condición preparada: sigue indicaciones elementales de forma y entradas/i)).toBeVisible();
  await expect(article.getByText(/score completo de U1 no visible durante la toma principal/i)).toBeVisible();
  await expect(article.getByText(/D7 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/sight-reading a primera vista/i)).toBeVisible();
  await expect(article.getByText(/I4 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F5 U1 checkpoint remains pre-D7-functional after U2', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/repertorio-a-en-desarrollo/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/NO es Hito 6/i)).toBeVisible();
  await expect(article.getByText(/D7 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
});