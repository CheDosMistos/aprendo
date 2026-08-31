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

test('F4 U6 overview makes H4 minimum explicit and keeps H7 separate', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/');
  await expect(page.getByRole('heading', { level: 1, name: 'Coordinación básica de cuatro extremidades' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Coordina patrones sencillos sin perder pulso/i)).toBeVisible();
  await expect(article.getByText(/Sólo cambia una capa/i)).toBeVisible();
  await expect(article.getByText(/U6 no certifica H7/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U6 L1 reuses the U5 four-limb score as the central pattern', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/patron-completo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Cuatro extremidades como un patrón completo' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Reutilizamos exactamente el ejercicio de U5/i)).toBeVisible();
  await expect(article.getByText(/No hay material rítmico nuevo/i)).toBeVisible();
  await expect(article.getByText(/Recompón las cuatro extremidades pronto/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U6 L2 diagnoses a limb or transition without adding a score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/diagnostico-extremidad/');
  await expect(page.getByRole('heading', { level: 1, name: 'Qué extremidad arrastra o anticipa' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ANTICIPA \/ ARRASTRA \/ DESAPARECE \/ DUPLICA/i)).toBeVisible();
  await expect(article.getByText(/PATRÓN COMPLETO → localizar unión → aislar sólo si hace falta → practicar unión → RECOMPONER/i)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expectPracticeCheckIn(page);
});

test('F4 U6 L3 renders Pattern B with only the left-foot layer changed', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/una-capa-cambia/');
  await expect(page.getByRole('heading', { level: 1, name: 'Una sola capa cambia: Patrón B' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ride: ocho corcheas/i)).toBeVisible();
  await expect(article.getByText(/caja: 2 y 4/i)).toBeVisible();
  await expect(article.getByText(/bombo: 1 y 3/i)).toBeVisible();
  await expect(article.getByText(/pie izquierdo: chick en negras 1–2–3–4/i)).toBeVisible();
  await expect(article.getByText(/sólo cambia el pie izquierdo/i)).toBeVisible();
  await expect(article.getByText(/U6 no certifica H7/i)).toBeVisible();
});

test('F4 U6 L4 renders A and B and keeps transfer block-based', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/recuperacion-transferencia/');
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperación y transferencia A ↔ B' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'Recuperación activa' })).toBeVisible();
  await expect(article.getByRole('heading', { name: 'Transferencia por bloques' })).toBeVisible();
  await expect(article.getByText(/Alternar dos patrones fijos/i)).toBeVisible();
  await expect(article.getByText(/No certifica H7/i)).toBeVisible();
});

test('F4 U6 checkpoint renders both patterns and certifies H4 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-6/h4-minimo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — H4 MÍNIMO' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Coordina patrones sencillos sin perder pulso/i)).toBeVisible();
  await expect(article.getByText(/No es obligatorio ejecutar A→B sin pausa/i)).toBeVisible();
  await expect(article.getByText(/H4 — COMPETENTE\/FUNCIONAL/)).toBeVisible();
  await expect(article.getByText(/H5 — COMPETENTE\/FUNCIONAL/)).toBeVisible();
  await expect(article.getByText(/H7 — independencia/)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U5 checkpoint remains pre-H4 after U6 introduces certification', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-5/primer-groove-estable/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/no certifica H4 MÍNIMO/i).first()).toBeVisible();
  await expect(article.getByText(/H5 — COMPETENTE\/FUNCIONAL/)).toBeVisible();
});
