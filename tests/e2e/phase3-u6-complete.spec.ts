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

test('Phase 3 U6 overview defines traceable G2 and postpones real-time improvisation to U7', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/');
  await expect(page.getByRole('heading', { level: 1, name: 'Transformaciones y desarrollo motívico' })).toBeVisible();
  await expect(page.getByText('A ESTABLE → ELEGIR UNA VARIABLE → TRANSFORMAR → ESCRIBIR A’ → TOCAR → COMPARAR → NOMBRAR → EXPLICAR → VOLVER A A', { exact: true })).toBeVisible();
  await expect(page.getByText(/3\+3\+2 dentro de 4\/4 ≠ 7\/8/).first()).toBeVisible();
  await expect(page.getByText(/No exige improvisación libre/)).toBeVisible();
  await expect(page.getByText(/una transformación consciente bien identificada/i)).toBeVisible();
});

test('U6 L1 renders A and A-prime and makes conserved changed and return-to-A explicit', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/el-contrato-de-transformacion-a-a-prime/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/SE CONSERVA:/).first()).toBeVisible();
  await expect(article.getByText(/CAMBIA:/).first()).toBeVisible();
  await expect(article.getByText('A → A’ → A', { exact: true }).first()).toBeVisible();
  const reference = article.locator('details').filter({ hasText: 'Mostrar análisis de referencia' });
  await expect(reference).toHaveCount(1);
  await expect(article.getByText(/A’ añade un ataque localizado/)).toBeHidden();
  await reference.locator('summary').click();
  await expect(article.getByText(/A’ añade un ataque localizado/)).toBeVisible();
});

test('U6 L2 renders structural family and separates deliberate reduction from omission', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/fragmentar-extender-y-reducir/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText('A → FRAGMENTO → EXTENSIÓN → REDUCCIÓN', { exact: true })).toBeVisible();
  await expect(article.getByText(/REDUCCIÓN DECIDIDA/)).toBeVisible();
  await expect(article.getByText(/OMISIÓN ACCIDENTAL/)).toBeVisible();
  await expect(article.getByText(/No hay porcentaje mágico/)).toBeVisible();
});

test('U6 L3 keeps temporal skeleton fixed and distinguishes audible from motor change', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/acento-dinamica-y-sticking/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/MusicXML representa el esqueleto temporal/i)).toBeVisible();
  await expect(article.getByText('ATAQUES/SILENCIOS: CONSERVADOS', { exact: true })).toBeVisible();
  await expect(article.getByText(/Cambiar sticking.*no implica necesariamente cambiar el ritmo audible/i)).toBeVisible();
  await expect(article.getByText(/No simulamos distribución entre caja, toms, bombo o platos/i)).toBeVisible();
});

test('U6 L4 keeps displacement in 4/4 and treats J2 as a window', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/desplazar-sin-cambiar-el-compas/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText('DESPLAZAMIENTO DENTRO DE 4/4 ≠ CAMBIO DE COMPÁS', { exact: true })).toBeVisible();
  await expect(article.getByText(/no certifica J2 funcional por sí sola/i)).toBeVisible();
  await expect(article.getByText(/Desplazamiento ≠ reagrupación/i)).toBeVisible();
});

test('U6 L5 keeps 3+3+2 as grouping inside 4/4', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/reagrupar-y-reacentuar/');
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText('3+3+2 dentro de 4/4 ≠ 7/8', { exact: true })).toBeVisible();
  await expect(article.getByText('MÉTRICA: 4/4', { exact: true })).toBeVisible();
  await expect(article.getByText('AGRUPACIÓN: 3+3+2', { exact: true })).toBeVisible();
  await expect(article.getByText(/agrupación pedagógica.*no barra de compás/i)).toBeVisible();
});

test('U6 G2 checkpoint requires one conscious transformation and explicitly does not certify G3', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-6/puerta-g2-hacia-improvisacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Puerta G2 hacia improvisación' })).toBeVisible();
  await expectOneScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/una transformación consciente bien identificada/i).first()).toBeVisible();
  await expect(article.getByText(/No necesitas combinar varias ni improvisar libremente/i)).toBeVisible();
  await expect(article.getByText(/AVANZADO no es requisito para U7/)).toBeVisible();
  await expect(article.getByText(/no certifica improvisación funcional G3/i)).toBeVisible();
});

test('U5 remains intact and U6 does not introduce an automatic transformation grader', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/identidad-mismo-relacionado-o-nuevo/');
  await expect(page.locator('article.course-article [data-notation-score]')).toHaveCount(3);

  await page.goto('/bateria/fase-3-unidad-6/el-contrato-de-transformacion-a-a-prime/');
  const article = page.locator('article.course-article');
  await expect(article.locator('[data-motif-transform]')).toHaveCount(0);
  await expect(article.locator('[data-notation-score]')).toHaveCount(1);
});
