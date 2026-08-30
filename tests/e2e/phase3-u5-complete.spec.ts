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

async function expectScoreReady(score: ReturnType<Page['locator']>) {
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
}

test('Phase 3 U5 overview defines G1 authorship and keeps systematic transformations for U6', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/');
  await expect(page.getByRole('heading', { level: 1, name: 'Motivo, identidad, repetición y contraste' })).toBeVisible();
  await expect(page.getByText('CREAR → TOCAR → ESCRIBIR → REPETIR → ESCUCHAR → COMPARAR → CONTRASTAR → RETORNAR → EXPLICAR', { exact: true })).toBeVisible();
  await expect(page.getByText(/No existe un porcentaje mágico de identidad/i)).toBeVisible();
  await expect(page.getByText(/Eso comienza en U6/)).toBeVisible();
  await expect(page.getByText(/No hay un corrector automático de creatividad/)).toBeVisible();
});

test('U5 L1 renders three model motives and requires creation plus retrieval', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/crear-un-motivo-que-puedas-reconocer/');
  const scores = page.locator('[data-notation-score]');
  await expect(scores).toHaveCount(1);
  await expectScoreReady(scores.first());
  await expect(page.getByText(/Cada compás .* motivo independiente/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: '3. Recuperación con interferencia' })).toBeVisible();
  await expect(page.getByText(/identidad.*continuidad/i)).toBeVisible();
});

test('U5 L2 renders A X Y and keeps the editorial classification hidden until requested', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/identidad-mismo-relacionado-o-nuevo/');
  const scores = page.locator('[data-notation-score]');
  await expect(scores).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await expectScoreReady(scores.nth(index));
  await expect(page.getByText('MISMO / RELACIONADO / NUEVO', { exact: true }).first()).toBeVisible();

  const details = page.locator('details');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(page.getByText(/En el diseño del ejercicio, X funciona como A’/)).toBeHidden();
  await details.locator('summary').click();
  await expect(page.getByText(/En el diseño del ejercicio, X funciona como A’/)).toBeVisible();
  await expect(page.getByText(/No demuestra una regla universal/)).toBeVisible();
});

test('U5 L3 renders literal A A B A and separates contrast from difficulty', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/repeticion-contraste-y-retorno/');
  const score = page.locator('[data-notation-score]');
  await expect(score).toHaveCount(1);
  await expectScoreReady(score);
  await expect(page.getByText('A → A → B → A', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/contraste no significa “más notas” ni “más difícil”/i)).toBeVisible();
  await expect(page.getByText(/andamiaje de esta tarea.*no una forma musical universal/i)).toBeVisible();
});

test('U5 L4 renders question response and separates memory continuity and relation', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/pregunta-respuesta-y-memoria-motivica/');
  const score = page.locator('[data-notation-score]');
  await expect(score).toHaveCount(1);
  await expectScoreReady(score);
  await expect(page.getByText(/MEMORIA:/)).toBeVisible();
  await expect(page.getByText(/CONTINUIDAD:/)).toBeVisible();
  await expect(page.getByText(/RELACIÓN:/)).toBeVisible();
  await expect(page.getByText(/Antecedente\/consecuente.*no es obligatorio/i)).toBeVisible();
});

test('U5 G1 checkpoint uses fresh C X material and does not require a G2 transformation', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-5/puerta-g1-hacia-transformacion/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Puerta G1 hacia transformación' })).toBeVisible();
  await expect(page.getByText(/nuevo para este checkpoint/i)).toBeVisible();
  await expect(page.getByText(/Conserva tu primera versión/i)).toBeVisible();
  await expect(page.getByText('A → A → B → A', { exact: true })).toBeVisible();

  const score = page.locator('[data-notation-score]');
  await expect(score).toHaveCount(1);
  await expectScoreReady(score);
  const details = page.locator('details');
  await expect(page.getByText(/El diseño pretendido es RELACIONADO/)).toBeHidden();
  await details.locator('summary').click();
  await expect(page.getByText(/El diseño pretendido es RELACIONADO/)).toBeVisible();
  await expect(page.getByText(/no necesitas todavía demostrar G2/i)).toBeVisible();
  await expect(page.getByText(/AVANZADO no es requisito para U6/)).toBeVisible();
});

test('U4 form widget remains intact and U5 does not introduce a creativity grader widget', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/de-la-celula-a-la-frase/');
  await expect(page.locator('.rhythm-form')).toHaveCount(1);
  await expect(page.locator('[data-form-block]').first()).toBeDisabled();

  await page.goto('/bateria/fase-3-unidad-5/identidad-mismo-relacionado-o-nuevo/');
  await expect(page.locator('.rhythm-form')).toHaveCount(0);
  await expect(page.locator('[data-motif-identity]')).toHaveCount(0);
  await expect(page.locator('[data-notation-score]')).toHaveCount(3);
});
