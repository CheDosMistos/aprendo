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

test('F4 U5 overview presents the neutral three-limb groove and H4 boundary', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/');
  await expect(page.getByRole('heading', { level: 1, name: 'Primer groove: tres extremidades y puente hacia cuatro' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/PATRÓN APRENDIDO ≠ GROOVE ESTABLE/i)).toBeVisible();
  await expect(article.getByText(/hi-hat cerrado en corcheas/i)).toBeVisible();
  await expect(article.getByText(/caja en 2 y 4/i)).toBeVisible();
  await expect(article.getByText(/bombo en 1 y 3/i)).toBeVisible();
  await expect(article.getByText(/no certifica H4 MÍNIMO/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U5 L1 renders Groove Base A and keeps left foot out', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/esqueleto-tres-extremidades/');
  await expect(page.getByRole('heading', { level: 1, name: 'Construir el esqueleto de tres extremidades' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/hi-hat cerrado en ocho corcheas/i)).toBeVisible();
  await expect(article.getByText(/bombo en 1 y 3, caja en 2 y 4/i)).toBeVisible();
  await expect(article.getByText(/No hay pie izquierdo en movimiento/i)).toBeVisible();
  await expect(article.getByText(/no es el destino final/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U5 L2 diagnoses coincidences without adding notation or notes', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/coincidencias-diagnostico/');
  await expect(page.getByRole('heading', { level: 1, name: 'Coincidencias, transiciones y diagnóstico' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/1: hi-hat \+ bombo/i)).toBeVisible();
  await expect(article.getByText(/2: hi-hat \+ caja/i)).toBeVisible();
  await expect(article.getByText(/Recompón inmediatamente el compás completo/i)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expectPracticeCheckIn(page);
});

test('F4 U5 L3 renders four-bar continuity and teaches recovery', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/continuidad-recuperacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Del compás al groove: continuidad y recuperación' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/cuatro compases/).first()).toBeVisible();
  await expect(article.getByText(/No hay variaciones/i)).toBeVisible();
  await expect(article.getByRole('heading', { name: 'Laboratorio' })).toBeVisible();
  await expect(article.getByRole('heading', { name: 'Interpretación' })).toBeVisible();
  await expect(article.getByText(/no obliga siempre a parar/i)).toBeVisible();
});

test('F4 U5 L4 renders optional four-limb bridge without certifying H4', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/puente-cuatro-extremidades/');
  await expect(page.getByRole('heading', { level: 1, name: 'Puente hacia cuatro extremidades' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/AMPLIACIÓN — no requisito del checkpoint U5/i)).toBeVisible();
  await expect(article.getByText(/ride en corcheas/i)).toBeVisible();
  await expect(article.getByText(/bombo en 1\/3 y caja en 2\/4/i)).toBeVisible();
  await expect(article.getByText(/chick de hi-hat en 2 y 4/i)).toBeVisible();
  await expect(article.getByText(/no certifica H4 MÍNIMO ni H7/i)).toBeVisible();
});

test('F4 U5 checkpoint renders the two required scores and keeps later skills open', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/primer-groove-estable/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Primer groove estable' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/primer groove estable en la condición practicada de tres extremidades/i)).toBeVisible();
  await expect(article.getByText(/H4 — coordinación básica de cuatro extremidades/)).toBeVisible();
  await expect(article.getByText(/H5 — COMPETENTE\/FUNCIONAL/)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expect(article.getByText(/La perfección no es requisito para continuar/i)).toBeVisible();
});

test('F4 U4 remains an H3 checkpoint after groove is introduced', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/hihat-pie-disponible/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H3 MÍNIMO/).first()).toBeVisible();
  await expect(article.getByText(/H5 — groove funcional/)).toBeVisible();
  await expect(article.getByText(/No es requisito para iniciar U5/i)).toBeVisible();
});
