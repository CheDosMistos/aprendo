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

test('F4 U8 overview makes B8 G5 dominant and preserves H6 H7 boundaries', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/');
  await expect(page.getByRole('heading', { level: 1, name: 'Orquestar vocabulario ya conocido' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: B8 \/ G5/i)).toBeVisible();
  await expect(article.getByText(/Una frase conocida debe seguir siendo reconocible/i)).toBeVisible();
  await expect(article.getByText(/no certifica B8 COMPETENTE, G5 COMPETENTE, H6 ni H7/i)).toBeVisible();
  await expect(article.getByText(/ACENTO ≠ SUPERFICIE/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U8 L1 reuses two U2 scores and keeps feet out', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/recuperar-identidad-superficies/');
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperar identidad sobre tres superficies' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ocho corcheas y sticking alternado R\/L/i)).toBeVisible();
  await expect(article.getByText(/Hoy no añadas pies todavía/i)).toBeVisible();
  await expect(article.getByText(/ACENTO ≠ SUPERFICIE/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U8 L2 renders known hands plus the stable foot base', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/pies-base-orquestacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pies simples bajo manos orquestadas' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ocho corcheas exactamente como U2\.L4/i)).toBeVisible();
  await expect(article.getByText(/bombo: 1 y 3/i)).toBeVisible();
  await expect(article.getByText(/pedal hi-hat: 2 y 4/i)).toBeVisible();
  await expect(article.getByText(/Los pies no reciben vocabulario nuevo/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U8 L3 compares two known orchestrations and demands a musical criterion', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/elegir-superficies/');
  await expect(page.getByRole('heading', { level: 1, name: 'Elegir superficies con criterio' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/TIMBRE \/ CLARIDAD \/ MOVIMIENTO \/ DINÁMICA \/ FUNCIÓN \/ COSTE FÍSICO/i)).toBeVisible();
  await expect(article.getByText(/Cambiar sticking deliberadamente es una decisión de B8/i)).toBeVisible();
  await expect(article.getByText(/un único acento/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U8 L4 transfers a personal motif without inventing a fixed score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/motivo-propio-al-kit/');
  await expect(page.getByRole('heading', { level: 1, name: 'Transferir un motivo propio al kit' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expect(article.getByText(/tu motivo es el material fuente/i)).toBeVisible();
  await expect(article.getByText(/Inventar uno nuevo y presentarlo como tu composición anterior rompería la continuidad/i)).toBeVisible();
  await expect(article.getByText(/VERSIÓN BASE → VERSIÓN ORQUESTADA → VERSIÓN BASE/i)).toBeVisible();
  await expect(article.getByText(/U8 no la certifica como fill H6/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U8 checkpoint renders base and full-kit scores and certifies G5 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-8/g5-b8-transferencia/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — G5 MÍNIMO / B8 transferencia' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Distribuye una frase conocida por superficies/i)).toBeVisible();
  await expect(article.getByText(/B8 en transferencia al kit/i)).toBeVisible();
  await expect(article.getByText(/B8 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/G5 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/H6 — fills/i)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U7 checkpoint remains pre-B8-G5 focal after U8', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-7/h5-minimo/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/B8\/G5 — orquestación focal de U8/)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/)).toBeVisible();
});