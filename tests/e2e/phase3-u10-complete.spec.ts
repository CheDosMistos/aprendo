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

test('U10 overview makes 7/8 core, 7/4 expansion and J3 levels explicit', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/');
  await expect(page.getByRole('heading', { level: 1, name: 'Siete: 7/8 funcional; 7/4 como ampliación' })).toBeVisible();
  await expect(page.getByText(/7\/8 ≠ septillo ≠ agrupación de siete notas/)).toBeVisible();
  await expect(page.getByText(/agrupación dentro del compás ≠ compás/)).toBeVisible();
  await expect(page.getByText(/J3 MÍNIMO GLOBAL/).first()).toBeVisible();
  await expect(page.getByText(/J3 COMPETENTE\/FUNCIONAL no se concede por calendario/)).toBeVisible();
});

test('U10 L1 renders real 7/8 and distinguishes septuplet conceptually', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/siete-corcheas-entrar-en-7-8/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/7\/8: siete corcheas por compás/)).toBeVisible();
  await expect(article.getByText(/Septillo: siete subdivisiones iguales/)).toBeVisible();
});

test('U10 L2 keeps three groupings inside the same 7/8', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/tres-agrupaciones-un-mismo-7-8/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/2\+2\+3/).first()).toBeVisible();
  await expect(article.getByText(/2\+3\+2/).first()).toBeVisible();
  await expect(article.getByText(/3\+2\+2/).first()).toBeVisible();
  await expect(article.getByText(/no cambia el compás/i)).toBeVisible();
});

test('U10 L3 renders A A-prime A and keeps transformation traceable', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/leer-escribir-transformar-en-7-8/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/A → A’ → A/).first()).toBeVisible();
  await expect(article.getByText(/SE CONSERVA \/ CAMBIA/)).toBeVisible();
  await expect(article.getByText(/sigue cerrando en 7\/8/)).toBeVisible();
});

test('U10 L4 names one bar of 7/8 and keeps answer hidden until reveal', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/oir-siete-metrica-agrupacion-dictado/');
  const widget = page.locator('.rhythm-dictation');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-pattern', '1101010');
  await expect(widget).toHaveAttribute('data-stimulus-label', '1 compás de 7/8');
  await expect(widget.getByText(/4 pulsos de entrada y después 1 compás de 7\/8/)).toBeVisible();
  await expect(widget.locator('[data-dictation-answer-score]')).toHaveCount(0);
  await widget.getByRole('button', { name: 'Escuchar dictado' }).click();
  await expect(widget).toHaveAttribute('data-listen-count', '1');
  await widget.getByRole('button', { name: 'Mostrar respuesta' }).click();
  const answer = widget.locator('[data-dictation-answer-score]');
  await expect(answer).toHaveCount(1);
  await expect(answer.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
});

test('U10 L5 renders 7/8 core plus explicitly optional 7/4 comparison', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/crear-en-7-8-mirar-7-4/');
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: /Parte B — AMPLIACIÓN: 7\/4/i })).toBeVisible();
  await expect(article.getByText(/no forma parte del mínimo/i)).toBeVisible();
  await expect(article.getByText(/7\/4 no es automáticamente.*7\/8 más lento/i)).toBeVisible();
});

test('U10 checkpoint separates J3 minimum from competent evidence', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/puerta-siete/');
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/J3 — MÍNIMO GLOBAL/)).toBeVisible();
  await expect(article.getByText(/Bloque B — opcional: evidencia para J3 COMPETENTE/)).toBeVisible();
  await expect(article.getByText(/Sólo si esta evidencia es funcional en ambas métricas puede registrarse J3 COMPETENTE/)).toBeVisible();
  await expect(article.getByText(/AVANZADO no es requisito para U11/)).toBeVisible();
});

test('U9 remains intact and U10 introduces no odd-meter grader', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-9/puerta-cinco/');
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(1);
  await page.goto('/bateria/fase-3-unidad-10/siete-corcheas-entrar-en-7-8/');
  await expect(page.locator('[data-odd-meter-grader], [data-meter-grader]')).toHaveCount(0);
});
