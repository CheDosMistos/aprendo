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
async function expectOneScoreReady(page: Page) {
  const score = page.locator('article.course-article [data-notation-score]');
  await expect(score).toHaveCount(1);
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
}

test('Phase 3 U7 overview defines restriction gradient and separates continuity content recovery and prompt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/');
  await expect(page.getByRole('heading', { level: 1, name: 'Improvisación rítmica con restricciones' })).toBeVisible();
  await expect(page.getByText(/más restricciones = mejor/i)).toBeVisible();
  await expect(page.getByText(/CONTINUIDAD:/).first()).toBeVisible();
  await expect(page.getByText(/RECUPERACIÓN:/).first()).toBeVisible();
  await expect(page.getByText(/No hay un grader automático de improvisación/i)).toBeVisible();
});

test('U7 L1 renders starting vocabulary and keeps improvisation un-prewritten', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/un-motivo-una-transformacion-una-frase/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText('1 MOTIVO + 1 TRANSFORMACIÓN + FRASE FIJA', { exact: true })).toBeVisible();
  await expect(article.getByText(/No adquieras una nueva mientras improvisas/i)).toBeVisible();
  await expect(article.getByText(/ACCIDENTE QUE QUIERO CONSERVAR/)).toBeVisible();
});

test('U7 L2 renders calls with silent response bars and no single editorial answer', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/call-and-response-escuchar-responder-continuar/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/No existe una única respuesta editorial correcta/i)).toBeVisible();
  await expect(article.getByText(/compases silenciosos.*no son pausas fuera del tiempo/i)).toBeVisible();
  await expect(article.getByText(/Antecedente\/consecuente clásico no es obligatorio/i)).toBeVisible();
});

test('U7 L3 renders density frame and distinguishes deliberate silence from blocking', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/densidad-y-silencio-como-restriccion/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'Silencio musical ≠ bloqueo' })).toBeVisible();
  await expect(article.getByText('MÁXIMO 4 ATAQUES POR COMPÁS', { exact: true })).toBeVisible();
  await expect(article.getByText('AL MENOS UN SILENCIO DELIBERADO POR FRASE', { exact: true })).toBeVisible();
});

test('U7 L4 renders two available variants and explicit recovery protocol', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/dos-transformaciones-y-recuperacion/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/dos operaciones ya conocidas/i)).toBeVisible();
  await expect(article.getByText(/no detengas el tiempo/i)).toBeVisible();
  await expect(article.getByText(/simplificación útil/i)).toBeVisible();
});

test('U7 L5 leaves development bars unwritten and removes only one aid at a time', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/retirar-la-restriccion-objetivo-formal-dinamico/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/El score fija el marco;.*no escribe tu improvisación/i)).toBeVisible();
  await expect(article.getByRole('heading', { name: /Retira una ayuda/i })).toBeVisible();
  await expect(article.getByText(/No retires todas a la vez/i)).toBeVisible();
});

test('U7 G3 checkpoint uses fresh prompt and explicitly does not certify G4', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/puerta-g3-hacia-composicion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Puerta G3 hacia composición' })).toBeVisible();
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/improvisar una frase corta respetando una restricción/i).first()).toBeVisible();
  await expect(article.getByText(/No escribas la respuesta completa antes/i)).toBeVisible();
  await expect(article.getByText(/AVANZADO no es requisito para U8/)).toBeVisible();
  await expect(article.getByText(/no certifica G4 composición funcional/i)).toBeVisible();
});

test('U6 remains intact and U7 introduces no improvisation grader widget', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/el-contrato-de-transformacion-a-a-prime/');
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(1);

  await page.goto('/bateria/fase-3-unidad-7/un-motivo-una-transformacion-una-frase/');
  const article = page.locator('article.course-article');
  await expect(article.locator('[data-improv-grader]')).toHaveCount(0);
  await expect(article.locator('[data-notation-score]')).toHaveCount(1);
});
