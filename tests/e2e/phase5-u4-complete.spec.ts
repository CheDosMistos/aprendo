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

test('F5 U4 overview keeps shuffle, ternary and Piece B boundaries explicit', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-4/');
  await expect(page.getByRole('heading', { level: 1, name: 'Shuffle, subdivisión ternaria y repertorio B' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/SHUFFLE ≠ “CORCHEAS ESCRITAS DE OTRA MANERA”/i)).toBeVisible();
  await expect(article.getByText(/Pieza B — ruta predominantemente auditiva/i)).toBeVisible();
  await expect(article.getByText(/AMPLIACIÓN — half-time shuffle/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F5 U4 L1 renders the triplet grid and separates 12/8 from shuffle', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-4/pulso-rejilla-ternaria/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pulso y rejilla ternaria' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/12\/8 ≠ shuffle/i)).toBeVisible();
  await expect(article.getByText(/compuesto cuaternario/i)).toBeVisible();
  await expect(article.getByText(/No afirman que todo shuffle tenga exactamente la misma microtemporización/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U4 L2 renders Shuffle CORE and teaches balance', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-4/shuffle-core-backbeat-balance/');
  await expect(page.getByRole('heading', { level: 1, name: 'Shuffle CORE: feel, backbeat y balance' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/rejilla pedagógica explícita/i)).toBeVisible();
  await expect(article.getByText(/CORCHEAS RECTAS → SHUFFLE → CORCHEAS RECTAS/i)).toBeVisible();
  await expect(article.getByText(/inter-dynamics/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U4 L3 is listening-first and deliberately has no score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-4/pieza-b-escuchar-antes-mirar/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pieza B: escuchar antes de mirar' })).toBeVisible();
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(0);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/La ausencia de una partitura en esta página es intencional/i)).toBeVisible();
  await expect(article.getByText(/mapa provisional/i).first()).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U4 L4 reveals Piece B form and renders its original score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-4/pieza-b-shuffle-forma-recuperacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pieza B: shuffle, forma y recuperación' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('table')).toHaveCount(1);
  await expect(article.getByText(/INTRO 4 → A 8 → B 4 → A' 4 → OUTRO 4/i)).toBeVisible();
  await expect(article.getByText(/PULSO → FORMA → FEEL → BALANCE → DETALLE/i)).toBeVisible();
  await expect(article.getByText(/AMPLIACIÓN — half-time shuffle/i)).toBeVisible();
  await expect(article.getByText(/no declara blues dominado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});
