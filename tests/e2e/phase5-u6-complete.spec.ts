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
async function expectNoScores(page: Page): Promise<void> {
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(0);
}

test('F5 U6 overview exposes H8 minimum and engineering boundary', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-6/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sonido funcional, afinación básica, click y grabación' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Novedad dominante: H8 funcional/i)).toBeVisible();
  await expect(article.getByText(/SONIDO FUNCIONAL ≠ INGENIERÍA DE AUDIO/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectNoScores(page);
});

test('F5 U6 L1 teaches comparable recording and balance', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-6/sonido-consistencia-balance/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sonido comparable: zona de golpe y balance' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/CONSISTENCIA ≠ TOCAR SIEMPRE EN EL CENTRO/i)).toBeVisible();
  await expect(article.getByText(/SÍNTOMA → HIPÓTESIS → UNA PRUEBA/i)).toBeVisible();
  await expectNoScores(page);
});

test('F5 U6 L2 keeps tuning comparative and reversible', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-6/afinacion-amortiguacion-comparada/');
  await expect(page.getByRole('heading', { level: 1, name: 'Afinación y amortiguación: comparar antes de decidir' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/AFINACIÓN ≠ BUSCAR UNA NOTA UNIVERSAL/i)).toBeVisible();
  await expect(article.getByText(/No adoptamos como norma universal ninguna nota concreta/i)).toBeVisible();
  await expectNoScores(page);
});

test('F5 U6 L3 treats click as a monitored reference', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-6/click-backing-monitorizacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Click y backing: referencia sin perseguirla' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/CLICK ≠ ALGO QUE HAY QUE PERSEGUIR/i)).toBeVisible();
  await expect(article.getByText(/mínimo nivel que permita seguir la referencia/i)).toBeVisible();
  await expectNoScores(page);
});

test('F5 U6 L4 uses one-question A B recording feedback', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-6/grabacion-ab-feedback/');
  await expect(page.getByRole('heading', { level: 1, name: 'Grabación A/B: una pregunta, dos tomas' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/UNA PREGUNTA > DIEZ IMPRESIONES/i)).toBeVisible();
  await expect(article.getByText(/1–2 prioridades/i)).toBeVisible();
  await expectNoScores(page);
});

test('F5 U6 Checkpoint 5C certifies H8 minimum only', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-5-unidad-6/h8-minimo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint 5C — H8 MÍNIMO' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H8 MÍNIMO: reconoce diferencias básicas de sonido y registra su ejecución/i)).toBeVisible();
  await expect(article.getByText(/aplica al menos un ajuste básico razonado y reversible/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectNoScores(page);
});
