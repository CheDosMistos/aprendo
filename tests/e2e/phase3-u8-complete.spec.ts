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

test('Phase 3 U8 overview defines G4 minimum, revision loop and authorship boundary', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/');
  await expect(page.getByRole('heading', { level: 1, name: 'Composición rítmica y revisión' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/1–4 compases coherentes y reproducibles/).first()).toBeVisible();
  await expect(article.getByText(/Complejidad ≠ calidad/)).toBeVisible();
  await expect(article.getByText(/No necesitas un editor de partituras dentro de Aprendo/i)).toBeVisible();
  await expect(article.getByText(/Hito 4.*U12/i)).toBeVisible();
});

test('U8 L1 renders V0 example but keeps the student composition open', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/de-la-toma-a-la-version-cero/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/VERSIÓN 0 \(V0\)/)).toBeVisible();
  await expect(article.getByText(/No es “la composición correcta”/)).toBeVisible();
  await expect(article.getByText(/desde la representación/i)).toBeVisible();
});

test('U8 L2 renders formal skeleton without universalising it', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/repeticion-retorno-y-esqueleto-formal/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText('A → A’ → B → A', { exact: true })).toBeVisible();
  await expect(article.getByText(/no una plantilla universal/i)).toBeVisible();
  await expect(article.getByText(/2\/4\/8\/16 compases.*no reglas/i)).toBeVisible();
});

test('U8 L3 renders one traceable transformation', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/una-transformacion-con-trazabilidad/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/una sola transformación G2 consciente/i)).toBeVisible();
  await expect(article.getByText('SE CONSERVA: …', { exact: true }).first()).toBeVisible();
  await expect(article.getByText('CAMBIA: …', { exact: true }).first()).toBeVisible();
});

test('U8 L4 renders contrast and closure without complexity proxy', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/contraste-y-cierre/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/contraste no significa “más notas” ni “más difícil”/i)).toBeVisible();
  await expect(article.getByText(/Cierre no significa obligatoriamente/i)).toBeVisible();
});

test('U8 L5 renders V0 and V1 and separates execution error from composition revision', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/version-cero-a-version-uno-grabar-comparar-revisar/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/V0 — CONSERVADA/)).toBeVisible();
  await expect(article.getByText(/Un error de ejecución no crea automáticamente V1/i)).toBeVisible();
  await expect(article.getByText(/V1 simplifica/i)).toBeVisible();
  await expect(article.getByText(/NO CAMBIO V0/)).toBeVisible();
});

test('U8 Checkpoint 3B leaves three bars open and does not claim final Hito 4', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-8/checkpoint-3b-autoria-en-desarrollo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint 3B — Autoría en desarrollo' })).toBeVisible();
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/semilla es opcional y no es una composición resuelta/i)).toBeVisible();
  await expect(article.getByText(/1–4 compases coherentes y reproducibles/).first()).toBeVisible();
  await expect(article.getByText(/no es el Hito 4 final/i)).toBeVisible();
  await expect(article.getByText(/AVANZADO no es requisito para U9/)).toBeVisible();
});

test('U7 remains intact and U8 introduces neither composition grader nor score editor', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-7/puerta-g3-hacia-composicion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Puerta G3 hacia composición' })).toBeVisible();

  await page.goto('/bateria/fase-3-unidad-8/de-la-toma-a-la-version-cero/');
  const article = page.locator('article.course-article');
  await expect(article.locator('[data-composition-grader]')).toHaveCount(0);
  await expect(article.locator('[data-score-editor]')).toHaveCount(0);
  await expect(article.locator('[data-notation-score]')).toHaveCount(1);
});
