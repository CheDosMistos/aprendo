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

async function expectPracticeCheckIn(page: Page): Promise<void> {
  const checkIn = page.getByLabel('Registrar esta práctica');
  await expect(checkIn.getByRole('heading', { name: 'Registrar esta práctica', exact: true })).toBeVisible();
}

test('F5 U3 overview makes style-not-pattern and I2 H5 boundaries explicit', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-3/');
  await expect(page.getByRole('heading', { level: 1, name: 'Backbeat, corchea, energía y forma' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: I2 \/ H5/i)).toBeVisible();
  await expect(article.getByText(/ESTILO ≠ PATRÓN/i)).toBeVisible();
  await expect(article.getByText(/ENERGÍA ≠ BPM ALTO ≠ VOLUMEN MÁXIMO/i)).toBeVisible();
  await expect(article.getByText(/No exige doble pedal, blast beat ni patrones rápidos de bombo/i)).toBeVisible();
  await expect(article.getByText(/no declara rock, pop o punk dominados/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F5 U3 L1 renders and plays the original core backbeat score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-3/backbeat-corcheas/');
  await expect(page.getByRole('heading', { level: 1, name: 'Backbeat y rejilla de corcheas' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/arquetipo pedagógico de entrada/i)).toBeVisible();
  await expect(article.getByText(/hi-hat cerrado: corcheas continuas/i)).toBeVisible();
  await expect(article.getByText(/caja: 2 y 4/i)).toBeVisible();
  await expect(article.getByText(/bombo: 1 y 3/i)).toBeVisible();
  await expect(article.getByText(/no convierten el ejercicio en un estándar universal de rock/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U3 L2 keeps rhythm stable while changing energy', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-3/energia-articulacion-dinamica/');
  await expect(page.getByRole('heading', { level: 1, name: 'Energía, articulación y dinámica' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ENERGÍA ≠ BPM ALTO ≠ VOLUMEN MÁXIMO/i)).toBeVisible();
  await expect(article.getByText(/El ritmo principal permanece igual/i)).toBeVisible();
  await expect(article.getByText(/No cambies simultáneamente bombo, fill, tempo y articulación/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U3 L3 teaches a sourced punk window without speed as definition', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-3/punk-continuidad-economia/');
  await expect(page.getByRole('heading', { level: 1, name: 'Ventana punk: continuidad y economía' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Marky Ramone/i)).toBeVisible();
  await expect(article.getByText(/Sex Pistols/i)).toBeVisible();
  await expect(article.getByText(/no define punk como “tocar muy rápido”/i)).toBeVisible();
  await expect(article.getByRole('heading', { name: 'Economía de movimiento', exact: true })).toBeVisible();
  await expect(article.getByText(/no forma parte del mínimo/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U3 L4 reuses Piece A and Chart A and keeps metal optional', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-3/pieza-a-energia-forma/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pieza A: backbeat, forma y decisiones de energía' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/TIEMPO → FORMA → FEEL → DINÁMICA → CUE → DETALLE/i)).toBeVisible();
  await expect(article.getByText(/Ventana metal — AMPLIACIÓN/i)).toBeVisible();
  await expect(article.getByText(/doble pedal/i)).toBeVisible();
  await expect(article.getByText(/no declara rock, pop o punk dominados/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U2 checkpoint remains D7 prepared-condition only after U3', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-2/d7-minimo/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/D7 MÍNIMO en condición preparada: sigue indicaciones elementales de forma y entradas/i)).toBeVisible();
  await expect(article.getByText(/D7 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
});