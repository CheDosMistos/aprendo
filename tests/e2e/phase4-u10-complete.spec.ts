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

const hito = /Mantener un groove básico estable mientras introduce pequeñas variaciones y fills sin perder forma ni pulso/i;

test('F4 U10 overview preserves literal Hito 5 without an advanced gate', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/');
  await expect(page.getByRole('heading', { level: 1, name: 'Integración y Hito 5: transferencia al kit' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(hito)).toBeVisible();
  await expect(article.getByText(/INTEGRAR NO ES HACERLO MÁS DIFÍCIL/i)).toBeVisible();
  await expect(article.getByText(/independencia H7/i)).toBeVisible();
  await expect(article.getByText(/5\/4 o 7\/8/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U10 L1 renders the three already-known building blocks', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/recuperar-cadena/');
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperar la cadena, no reaprenderla' })).toBeVisible();
  await expectScoresReady(page, 3);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/RECUPERAR → DIAGNOSTICAR → CORREGIR UNA VARIABLE → RECOMPONER/i)).toBeVisible();
  await expect(article.getByText(/Un fallo local no invalida un cierre anterior/i)).toBeVisible();
  await expect(article.getByText(/DISPONIBLE/i).first()).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U10 L2 reuses U7 variation before any fill is added', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/variacion-retorno/');
  await expect(page.getByRole('heading', { level: 1, name: 'Groove → variación → groove' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/GROOVE → PEQUEÑA VARIACIÓN → GROOVE/i)).toBeVisible();
  await expect(article.getByText(/bombo en & de 3/i)).toBeVisible();
  await expect(article.getByText(/No añadas Fill A/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U10 L3 reuses the one-beat fill and its explicit landing', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/fill-retorno/');
  await expect(page.getByRole('heading', { level: 1, name: 'Groove → fill → 1 → groove' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Fill A ocupa sólo 4 &/i)).toBeVisible();
  await expect(article.getByText(/El Hito necesita un fill breve, no el fill más difícil/i)).toBeVisible();
  await expect(article.getByText(/No añadas Variación B durante este correctivo/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U10 L4 renders the integrated five-bar Hito score', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/ensayo-grabacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Ensayo completo, grabación y diagnóstico' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/A → VARIACIÓN → A → FILL → A/i)).toBeVisible();
  await expect(article.getByText(/B — Variación: sólo bombo añadido en & de 3/i)).toBeVisible();
  await expect(article.getByText(/Fill A: groove en tiempos 1–3 y fill 4 &/i)).toBeVisible();
  await expect(article.getByText(/El Hito 5 no es una prueba de independencia H7/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U10 checkpoint renders Hito score and preserves the literal approved milestone', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-10/hito-5/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hito 5 — Transferencia al kit' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(hito)).toBeVisible();
  await expect(article.getByText(/A → VARIACIÓN → A → FILL → A/i)).toBeVisible();
  await expect(article.getByText(/no se exige mantener el pie izquierdo durante el fill/i)).toBeVisible();
  await expect(article.getByText(/grabación o evidencia equivalente/i)).toBeVisible();
  await expect(article.getByText(/H4 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/H5 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/H6 COMPETENTE\/FUNCIONAL global/i)).toBeVisible();
  await expect(article.getByText(/No existe BPM de aprobado/i)).toBeVisible();
});

test('F4 U9 checkpoint remains H6-minimum-only after Hito integration', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-9/h6-minimo/');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/H6 COMPETENTE\/FUNCIONAL/i)).toBeVisible();
  await expect(article.getByText(/U9 NO certifica H7/i)).toBeVisible();
});