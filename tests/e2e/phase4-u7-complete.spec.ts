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
    await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
    await expect(score.getByRole('button', { name: 'Reproducir partitura' })).toBeEnabled();
  }
}

async function expectPracticeCheckIn(page: Page): Promise<void> {
  const checkIn = page.getByLabel('Registrar esta práctica');
  await expect(checkIn.getByRole('heading', { name: 'Registrar esta práctica', exact: true })).toBeVisible();
}

test('F4 U7 overview makes H5 minimum explicit and preserves H7 boundary', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/');
  await expect(page.getByRole('heading', { level: 1, name: 'Groove estable y pequeñas variaciones' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Mantiene grooves básicos estables/i)).toBeVisible();
  await expect(article.getByText(/Variación B/i).first()).toBeVisible();
  await expect(article.getByText(/A–A–B–A/i).first()).toBeVisible();
  await expect(article.getByText(/no certifica H5 COMPETENTE\/FUNCIONAL, H4 COMPETENTE\/FUNCIONAL ni H7/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U7 L1 reuses Groove A and trains continuity without new rhythm', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/sostener-groove-a/');
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperar y sostener Groove A' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/No hay material rítmico nuevo/i)).toBeVisible();
  await expect(article.getByRole('heading', { name: 'Modo interpretación' })).toBeVisible();
  await expect(article.getByRole('heading', { name: 'Modo laboratorio' })).toBeVisible();
  await expect(article.getByText(/Recompón el groove completo pronto/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U7 L2 renders Variation B with one extra kick and no H7 claim', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/variacion-bombo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Una nota cambia: Variación B' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/bombo: 1, 3 y/i)).toBeVisible();
  await expect(article.getByText(/sólo se añade una nota de bombo/i)).toBeVisible();
  await expect(article.getByText(/U7 no certifica H7/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U7 L3 renders A-A-B-A and requires explicit return', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/aaba-variar-volver/');
  await expect(page.getByRole('heading', { level: 1, name: 'A–A–B–A: variar y volver' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/GROOVE → VARIACIÓN → RETORNO/i)).toBeVisible();
  await expect(article.getByText(/tiempo 1 del compás 4/i)).toBeVisible();
  await expect(article.getByText(/recompón A–A–B–A inmediatamente/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U7 L4 renders both comparison scores and limits feedback to priorities', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/grabar-comparar/');
  await expect(page.getByRole('heading', { level: 1, name: 'Grabar, comparar y decidir' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Elige 1–2 prioridades/i)).toBeVisible();
  await expect(article.getByText(/OBSERVACIÓN → HIPÓTESIS → CAMBIO DE UNA VARIABLE → NUEVA TOMA/i)).toBeVisible();
  await expect(article.getByText(/segunda variación dinámica/i)).toBeVisible();
  await expect(article.getByText(/no es requisito del checkpoint/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U7 checkpoint renders A, B and AABA and certifies H5 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/h5-minimo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — H5 MÍNIMO' })).toBeVisible();
  await expectScoresReady(page, 3);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Mantiene grooves básicos estables/i)).toBeVisible();
  await expect(article.getByText(/vuelves a A tras la variación/i)).toBeVisible();
  await expect(article.getByText(/H5 — COMPETENTE\/FUNCIONAL/)).toBeVisible();
  await expect(article.getByText(/H4 — COMPETENTE\/FUNCIONAL global/)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/)).toBeVisible();
  await expect(article.getByText(/H6 — fills/)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U6 checkpoint remains H4-minimum-only after U7', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/h4-minimo/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H5 — COMPETENTE\/FUNCIONAL/)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/)).toBeVisible();
});