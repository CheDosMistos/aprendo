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

test('F5 U5 overview exposes H7 contextual boundaries', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-5/');
  await expect(page.getByRole('heading', { level: 1, name: 'Semicorchea, pocket, articulación y primera independencia funcional' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: H7 contextual/i)).toBeVisible();
  await expect(article.getByText(/Ghost notes: textura, no puerta/i)).toBeVisible();
  await expect(article.getByText(/ESP-21.*fuera del tronco/i)).toBeVisible();
});

test('F5 U5 L1 renders the original sixteenth grid', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-5/rejilla-semicorcheas/');
  await expect(page.getByRole('heading', { level: 1, name: 'Rejilla de semicorcheas sin correr' })).toBeVisible();
  await expectScoresReady(page);
  await expect(page.locator('article.course-article').getByText(/SEMICORCHEA ≠ FUNK/i)).toBeVisible();
});

test('F5 U5 L2 renders dynamic hierarchy and keeps ghosts optional for H7', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-5/notas-principales-textura/');
  await expect(page.getByRole('heading', { level: 1, name: 'Notas principales, textura y ghost notes' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/BACKBEAT CLARO > TEXTURA SUAVE/i)).toBeVisible();
  await expect(article.getByText(/Checkpoint 5B no las exige/i)).toBeVisible();
});

test('F5 U5 L3 renders the fixed-layer variable-voice H7 task', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-5/h7-capa-fija-voz-variable/');
  await expect(page.getByRole('heading', { level: 1, name: 'H7 contextual: una capa fija mientras otra voz cambia' })).toBeVisible();
  await expectScoresReady(page);
  await expect(page.locator('article.course-article').getByText(/Sólo cambia el bombo/i)).toBeVisible();
});

test('F5 U5 L4 reuses the H7 task and preserves Piece B shuffle identity', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-5/pocket-integracion-musical/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pocket: sostener la función durante una frase' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/A 4 compases → B 4 → A 4 → B 4/i)).toBeVisible();
  await expect(article.getByText(/No conviertas su shuffle en funk/i)).toBeVisible();
});

test('F5 U5 Checkpoint 5B renders fresh material and certifies H7 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-5/h7-minimo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint 5B — H7 MÍNIMO' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H7 MÍNIMO: mantiene un ostinato simple mientras otra voz varía/i)).toBeVisible();
  await expect(article.getByText(/No certifica independencia avanzada/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});
