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
async function expectScoresReady(page: Page, count = 1) {
  const scores = page.locator('article.course-article [data-notation-score]');
  await expect(scores).toHaveCount(count);
  for (let i = 0; i < count; i += 1) await expect(scores.nth(i).locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
}

test('U9 overview makes 5/4 core and 5/8 expansion explicit', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/');
  await expect(page.getByRole('heading', { level: 1, name: 'Cinco: 5/4 funcional; 5/8 como ampliación' })).toBeVisible();
  await expect(page.getByText(/5\/4 ≠ quintillo ≠ agrupación de cinco notas/)).toBeVisible();
  await expect(page.getByText(/agrupación dentro del compás ≠ compás/)).toBeVisible();
  await expect(page.getByText(/no declara J3 globalmente funcional/i)).toBeVisible();
});

test('U9 L1 renders real 5/4 and distinguishes quintuplet conceptually', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/cinco-pulsos-entrar-en-5-4/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/5\/4: cinco negras por compás/)).toBeVisible();
  await expect(article.getByText(/Quintillo: cinco subdivisiones iguales/)).toBeVisible();
  await expect(article.getByText(/andamiaje, no fracaso/i)).toBeVisible();
});

test('U9 L2 keeps 3+2 and 2+3 inside the same meter', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/agrupar-5-4-3-2-2-3/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Ambas suman cinco negras/)).toBeVisible();
  await expect(article.getByText(/no cambia el compás/i)).toBeVisible();
  await expect(article.getByText(/no una lista exhaustiva/i)).toBeVisible();
});

test('U9 L3 renders A A-prime A and keeps transformation traceable', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/leer-escribir-transformar-en-5-4/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/A → A’ → A/).first()).toBeVisible();
  await expect(article.getByText(/SE CONSERVA \/ CAMBIA/)).toBeVisible();
  await expect(article.getByText(/sigue sumando 5\/4/)).toBeVisible();
});

test('U9 L4 keeps dictation answer hidden until reveal', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/oir-cinco-hipotesis-dictado-verificacion/');
  const widget = page.locator('.rhythm-dictation');
  await expect(widget).toHaveCount(1); await expect(widget).toHaveAttribute('data-pattern', '1101010010');
  await expect(widget.locator('[data-dictation-answer-score]')).toHaveCount(0);
  await widget.getByRole('button', { name: 'Escuchar dictado' }).click();
  await expect(widget).toHaveAttribute('data-listen-count', '1');
  await widget.getByRole('button', { name: 'Mostrar respuesta' }).click();
  const answer = widget.locator('[data-dictation-answer-score]');
  await expect(answer).toHaveCount(1); await expect(answer.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
});

test('U9 L5 renders 5/4 core plus explicitly optional 5/8 comparison', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/crear-en-5-4-mirar-5-8/');
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: /Parte B — AMPLIACIÓN: 5\/8/i })).toBeVisible();
  await expect(article.getByText(/no forma parte del mínimo/i)).toBeVisible();
  await expect(article.getByText(/5\/8 no es automáticamente.*5\/4 más rápido/i)).toBeVisible();
});

test('U9 checkpoint certifies only basic functional 5/4', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/puerta-cinco/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/5\/4 funcional básico; J3 continúa EN DESARROLLO/)).toBeVisible();
  await expect(article.getByText(/5\/4 ≠ quintillo ≠ agrupación de cinco notas/)).toBeVisible();
  await expect(article.getByText(/AVANZADO no es requisito para U10/)).toBeVisible();
});

test('U8 remains intact and U9 introduces no odd-meter grader', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-8/de-la-toma-a-la-version-cero/');
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(1);
  await page.goto('/bateria/fase-3-unidad-9/cinco-pulsos-entrar-en-5-4/');
  await expect(page.locator('[data-odd-meter-grader], [data-meter-grader]')).toHaveCount(0);
});
