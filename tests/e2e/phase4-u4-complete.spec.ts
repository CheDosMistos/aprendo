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

test('F4 U4 overview exposes H3 minimum as a branch parallel to H2', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hi-hat de pie: cerrar, abrir y sostener referencia' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H2 bombo y H3 hi-hat de pie ramas paralelas/i)).toBeVisible();
  await expect(article.getByText(/mantener aperturas\/cierres u ostinatos simples/i)).toBeVisible();
  await expect(article.getByText(/TRADICIÓN PEDAGÓGICA \/ OPCIONES TÉCNICAS/)).toBeVisible();
  await expect(article.getByText(/no certifica H4/)).toBeVisible();
});

test('F4 U4 L1 isolates open close chick without a score or universal settings', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/abrir-cerrar-chick/');
  await expect(page.getByRole('heading', { level: 1, name: 'Abrir, cerrar y producir chick' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ABRE \/ CIERRA \/ ESCUCHA \/ PREPARA/)).toBeVisible();
  await expect(article.getByText(/SONIDO \/ CIERRE \/ RETORNO \/ EQUILIBRIO \/ TENSIÓN/)).toBeVisible();
  await expect(article.getByText(/No fijamos una separación, presión ni recorrido universales/)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expectPracticeCheckIn(page);
});

test('F4 U4 L2 keeps heel mechanics optional and partial opening as expansion', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/mecanica-presion-opciones/');
  await expect(page.getByRole('heading', { level: 1, name: 'Mecánica y presión: opciones, no dogmas' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/heel-down y heel-up son TRADICIÓN PEDAGÓGICA \/ OPCIONES TÉCNICAS/i)).toBeVisible();
  await expect(article.getByText(/Zildjian Education presenta ambas/)).toBeVisible();
  await expect(article.getByText(/no demuestra superioridad científica/)).toBeVisible();
  await expect(article.getByText(/AMPLIACIÓN — rango parcialmente abierto/)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expectPracticeCheckIn(page);
});

test('F4 U4 L3 renders playable foot hi-hat pulse with 2 and 4 optional', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/chick-ostinato-simple/');
  await expect(page.getByRole('heading', { level: 1, name: 'Chick como ostinato simple' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/A — ESENCIAL AHORA/)).toBeVisible();
  await expect(article.getByText(/B — AMPLIACIÓN/)).toBeVisible();
  await expect(article.getByText(/No hay manos ni bombo/)).toBeVisible();
  await expect(article.getByText(/2 y 4 no es una etiqueta estilística/)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/)).toBeVisible();
});

test('F4 U4 L4 renders two voices without kick and keeps H4 uncertified', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/referencia-pie-manos/');
  await expect(page.getByRole('heading', { level: 1, name: 'Referencia de pie bajo manos conocidas' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ocho corcheas alternadas R\/L/)).toBeVisible();
  await expect(article.getByText(/chick de pedal hi-hat en las cuatro negras/)).toBeVisible();
  await expect(article.getByText(/No hay bombo/)).toBeVisible();
  await expect(article.getByText(/no hace falta haber completado H2/i)).toBeVisible();
  await expect(article.getByText(/no certifica H4 ni H7/i)).toBeVisible();
});

test('F4 U4 checkpoint renders both scores and certifies only H3 minimum', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-4/hihat-pie-disponible/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Hi-hat de pie disponible' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H3 MÍNIMO/).first()).toBeVisible();
  await expect(article.getByText(/negras = ESENCIAL AHORA/i)).toBeVisible();
  await expect(article.getByText(/tiempos 2 y 4 = AMPLIACIÓN/i)).toBeVisible();
  await expect(article.getByText(/H2 — técnica de bombo/)).toBeVisible();
  await expect(article.getByText(/H4 — coordinación básica de cuatro extremidades/)).toBeVisible();
  await expect(article.getByText(/H5 — groove funcional/)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/)).toBeVisible();
  await expect(article.getByText(/La perfección no es requisito para continuar/)).toBeVisible();
});

test('F4 U3 checkpoint remains H2-only after left-foot branch is introduced', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/bombo-primera-voz-pie/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H2 MÍNIMO/).first()).toBeVisible();
  await expect(article.getByText(/H3 — hi-hat de pie/)).toBeVisible();
  await expect(article.getByText(/H4 — coordinación básica de cuatro extremidades/)).toBeVisible();
});
