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

test('F5 U1 overview introduces longer form without a style claim', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/');
  await expect(page.getByRole('heading', { level: 1, name: 'Reentrada funcional y repertorio A' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: duración \+ forma \+ continuidad/i)).toBeVisible();
  await expect(article.getByText(/NO REAPRENDER\. SOSTENER DURANTE MÁS TIEMPO/i)).toBeVisible();
  await expect(article.getByText(/INTRO 4 → A 8 → B 8 → OUTRO 4/i)).toBeVisible();
  await expect(article.getByText(/esqueleto formal mínimo/i)).toBeVisible();
  await expect(article.getByText(/No pretende representar ningún estilo concreto/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F5 U1 L1 renders the known Hito 5 score and avoids reteaching', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/recuperar-sin-reaprender/');
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperar sin reaprender' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Un fallo local hoy no invalida un cierre anterior/i)).toBeVisible();
  await expect(article.getByText(/SÍNTOMA → HIPÓTESIS → PRUEBA → CORRECCIÓN → RECOMPONER/i)).toBeVisible();
  await expect(article.getByText(/CORE 3 extremidades/i)).toBeVisible();
  await expect(article.getByText(/CORE 4 extremidades/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U1 L2 renders the 24-bar formal skeleton and prepares D7', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/mapa-pieza-a/');
  await expect(page.getByRole('heading', { level: 1, name: 'Ver la forma antes de tocarla entera' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/esqueleto formal mínimo/i)).toBeVisible();
  await expect(article.getByText(/24 compases de 4\/4/i)).toBeVisible();
  await expect(article.getByText(/TIEMPO → FORMA → ENTRADA → DETALLE/i)).toBeVisible();
  await expect(article.getByText(/U1 sólo prepara D7/i)).toBeVisible();
  await expect(article.getByText(/120 BPM únicamente como metadato técnico/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U1 L3 renders Piece A and teaches whole-part-whole transitions', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/unir-secciones/');
  await expect(page.getByRole('heading', { level: 1, name: 'Unir secciones sin perder la pieza' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/INTRO → A/i)).toBeVisible();
  await expect(article.getByText(/A → B/i)).toBeVisible();
  await expect(article.getByText(/B → OUTRO/i)).toBeVisible();
  await expect(article.getByText(/No practiques 24 compases completos para corregir un fallo de dos compases/i)).toBeVisible();
  await expect(article.getByText(/FORMA → TRANSICIÓN → RETORNO/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U1 L4 uses continuous interpretation recovery and recording', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/toma-continua-recuperacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Primera toma continua y recuperación' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/UN ERROR LOCAL NO DEBE CONVERTIRSE AUTOMÁTICAMENTE EN PÉRDIDA DE FORMA/i)).toBeVisible();
  await expect(article.getByText(/LO QUE CREO QUE HAGO ↔ LO QUE REALMENTE SUENA/i)).toBeVisible();
  await expect(article.getByText(/120 BPM únicamente como metadato técnico/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F5 U1 checkpoint renders Piece A without promoting Hito 6 or I4', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-1/repertorio-a-en-desarrollo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Repertorio A en desarrollo' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/NO es Hito 6/i)).toBeVisible();
  await expect(article.getByText(/NO certifica I4 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/D7 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/H5 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/H6 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 Hito 5 remains unchanged when F5 U1 starts', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/hito-5/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Mantener un groove básico estable mientras introduce pequeñas variaciones y fills sin perder forma ni pulso/i)).toBeVisible();
  await expect(article.getByText(/H5 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/H6 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
});