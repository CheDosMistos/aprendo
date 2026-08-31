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

async function expectScoreReady(page: Page) {
  const score = page.locator('article.course-article [data-notation-score]');
  await expect(score).toHaveCount(1);
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.getByRole('button', { name: 'Reproducir partitura' })).toBeEnabled();
}

async function expectPracticeCheckIn(page: Page): Promise<void> {
  const checkIn = page.getByLabel('Registrar esta práctica');
  await expect(checkIn.getByRole('heading', { name: 'Registrar esta práctica', exact: true })).toBeVisible();
}

test('F4 U2 overview makes within-phrase transfer and dependency boundaries explicit', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/');
  await expect(page.getByRole('heading', { level: 1, name: 'De pad a caja y de caja a superficies' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Cuando la superficie es nueva, el ritmo debe ser viejo/i).first()).toBeVisible();
  await expect(article.getByText(/algunos ataques cambian de lugar.*dentro de la propia frase/i)).toBeVisible();
  await expect(article.getByText(/no declara G5 MÍNIMO ni B8-kit completo/i)).toBeVisible();
});

test('F4 U2 L1 renders a playable snare baseline and one-variable diagnosis', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/linea-base-caja-real/');
  await expect(page.getByRole('heading', { level: 1, name: 'Línea base: misma frase, caja real' })).toBeVisible();
  await expectScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/TIEMPO \/ STICKING \/ SUPERFICIE \/ MOVIMIENTO/)).toBeVisible();
  await expect(article.getByText(/No hay BPM de aprobado/)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U2 L2 renders two manual surfaces without introducing feet', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/dos-superficies-rl/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dos superficies: R y L cambian de lugar' })).toBeVisible();
  await expectScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/La novedad es espacial\/tímbrica\. El ritmo sigue siendo el mismo/)).toBeVisible();
  await expect(article.getByText(/No se usa bombo ni hi-hat de pie/)).toBeVisible();
  await expect(article.getByText(/No demuestra todavía coordinación H4 ni G5 MÍNIMO completo/)).toBeVisible();
});

test('F4 U2 L3 keeps accent, dynamics and timbre conceptually separate', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/acento-timbre/');
  await expect(page.getByRole('heading', { level: 1, name: 'Acento y timbre: relación, no identidad' })).toBeVisible();
  await expectScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/ACENTO ≠ SUPERFICIE/).first()).toBeVisible();
  await expect(article.getByText(/No estás estudiando todavía el vocabulario estilístico de ghost notes/)).toBeVisible();
  await expect(article.getByText(/Porque es más difícil.*no es un criterio musical suficiente/i)).toBeVisible();
});

test('F4 U2 L4 renders a three-surface traceable route with return', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/identidad-superficies-retorno/');
  await expect(page.getByRole('heading', { level: 1, name: 'Frase con identidad: 2–3 superficies y retorno' })).toBeVisible();
  await expectScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/TRAZABILIDAD TÍMBRICA/)).toBeVisible();
  await expect(article.getByText(/RITMO \/ STICKING \/ ACENTOS \/ SILENCIOS \/ CONTORNO DINÁMICO/)).toBeVisible();
  await expect(article.getByText(/No certifica H4, G5 MÍNIMO completo ni B8-kit competente/)).toBeVisible();
});

test('F4 U2 checkpoint exposes transfer minimum without hidden H2-H6 requirements', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/misma-idea-varias-superficies/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Misma idea, varias superficies' })).toBeVisible();
  await expectScoreReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'MÍNIMO PARA AVANZAR A U3/U4' })).toBeVisible();
  await expect(article.getByText(/TIEMPO \/ ACCESO \/ SUPERFICIE \/ STICKING \/ DINÁMICA/)).toBeVisible();
  await expect(article.getByText(/H2 — técnica de bombo/)).toBeVisible();
  await expect(article.getByText(/H6 — fills/)).toBeVisible();
  await expect(article.getByText(/G5 MÍNIMO completo/)).toBeVisible();
  await expect(article.getByText(/Cierre registrado ≠ competencia demostrada/)).toBeVisible();
});

test('F4 U1 zero-transfer boundary remains intact after U2 is added', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-1/transferencia-cero/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Todavía no alternes caja\/tom dentro de la misma frase/)).toBeVisible();
  await expect(article.getByText(/U2 lo desarrollará/)).toBeVisible();
});
