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

test('F4 U9 overview makes H6 dominant and H7 a window only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fills, retorno al groove y primera capa de independencia' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: H6 — transición funcional/i)).toBeVisible();
  await expect(article.getByText(/FILL = TRANSICIÓN, NO EXHIBICIÓN/i)).toBeVisible();
  await expect(article.getByText(/GROOVE → FILL → 1 → GROOVE/i)).toBeVisible();
  await expect(article.getByText(/puede certificar H6 MÍNIMO/i)).toBeVisible();
  await expect(article.getByText(/no certifica H6 COMPETENTE\/FUNCIONAL ni H7/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U9 L1 renders the one-beat fill and requires the following 1', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/fill-a-un-tiempo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fill A: un tiempo y vuelta al 1' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/4: caja — R/i)).toBeVisible();
  await expect(article.getByText(/tom agudo — L/i)).toBeVisible();
  await expect(article.getByText(/siguiente evento obligatorio: tiempo 1/i)).toBeVisible();
  await expect(article.getByText(/la versión CORE no exige un ostinato continuo del pie izquierdo/i)).toBeVisible();
  await expect(article.getByText(/Si el fill sale pero el siguiente 1 desaparece/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U9 L2 renders the two-beat fill with known U2 U8 hand vocabulary', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/fill-b-dos-tiempos/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fill B: dos tiempos con vocabulario conocido' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/3 & 4 & → 1/i)).toBeVisible();
  await expect(article.getByText(/tom agudo — R/i)).toBeVisible();
  await expect(article.getByText(/tom grave — R/i)).toBeVisible();
  await expect(article.getByText(/trabajado en U2\/U8/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U9 L3 reuses Fill B and limits orchestration changes', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/misma-duracion-otra-orquestacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Misma duración, otra orquestación' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/MISMO RITMO \+ MISMA DURACIÓN \+ MISMO 1 → CAMBIO TÍMBRICO LIMITADO/i)).toBeVisible();
  await expect(article.getByText(/Cambia sólo 1–2 ataques/i)).toBeVisible();
  await expect(article.getByText(/ACENTO ≠ SUPERFICIE/i)).toBeVisible();
  await expect(article.getByText(/DURACIÓN \/ PULSO \/ TIMBRE \/ MOVIMIENTO \/ 1 \/ RECUPERACIÓN/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U9 L4 renders recovery core and optional H7 window', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/recuperacion-ventana-h7/');
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperación y ventana H7' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/NO CONVERTIR UN ERROR DEL FILL EN LA PÉRDIDA DEL COMPÁS SIGUIENTE/i)).toBeVisible();
  await expect(article.getByText(/AMPLIACIÓN — ventana H7/i)).toBeVisible();
  await expect(article.getByText(/pedal hi-hat en negras continuas/i)).toBeVisible();
  await expect(article.getByText(/U9 NO certifica H7/i)).toBeVisible();
  await expect(article.getByText(/Una exposición no equivale a una competencia funcional/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U9 checkpoint renders both choices and certifies H6 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/h6-minimo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — H6 MÍNIMO: fill y retorno' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Inserta fills sencillos sin perder el pulso/i)).toBeVisible();
  await expect(article.getByText(/GROOVE → FILL → 1 → GROOVE/i)).toBeVisible();
  await expect(article.getByText(/No necesitas ejecutar los dos/i)).toBeVisible();
  await expect(article.getByText(/H6 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/U9 NO certifica H7/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U8 checkpoint remains explicitly pre-H6 after U9', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/g5-b8-transferencia/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H6 — fills/i)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/i)).toBeVisible();
});