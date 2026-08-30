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

test('F4 U3 overview exposes H2 minimum and rejects a universal pedal technique', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/');
  await expect(page.getByRole('heading', { level: 1, name: 'Bombo: primer control de pedal' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/Cuando el pie es nuevo, el ritmo debe ser viejo/i).first()).toBeVisible();
  await expect(article.getByText(/MÍNIMO de H2 no es velocidad/)).toBeVisible();
  await expect(article.getByText(/no demuestra que heel-down, heel-up, heel-toe, slide.*universalmente superior/i)).toBeVisible();
  await expect(article.getByText(/no certifica H4/)).toBeVisible();
});

test('F4 U3 L1 teaches hit return preparation without a universal geometry', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/pedal-primer-golpe/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pedal, posición y primer golpe simple' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/GOLPE \/ VUELTA \/ PREPARA/)).toBeVisible();
  await expect(article.getByText(/No existe una altura de asiento, un ángulo de rodilla\/tobillo o una tensión de muelle universalmente correctos/)).toBeVisible();
  await expect(article.getByText(/SONIDO \/ RETORNO \/ EQUILIBRIO \/ TENSIÓN/)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expectPracticeCheckIn(page);
});

test('F4 U3 L2 keeps heel mechanics and beater contact as options, not dogma', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/mecanica-sonido-opciones/');
  await expect(page.getByRole('heading', { level: 1, name: 'Mecánica y sonido: opciones, no dogmas' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/TRADICIÓN PEDAGÓGICA \/ OPCIONES TÉCNICAS/)).toBeVisible();
  await expect(article.getByText(/CONTROL \/ SONIDO \/ BALANCE \/ ESFUERZO/)).toBeVisible();
  await expect(article.getByText(/deja que la maza se separe del parche/)).toBeVisible();
  await expect(article.getByText(/maza permanezca contra el parche/)).toBeVisible();
  await expect(article.getByText(/no como evidencia experimental de superioridad/)).toBeVisible();
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expectPracticeCheckIn(page);
});

test('F4 U3 L3 renders playable kick quarters and eighths without a BPM gate', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/negras-corcheas-consistencia/');
  await expect(page.getByRole('heading', { level: 1, name: 'Negras y corcheas: consistencia antes que velocidad' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/compás A — cuatro negras de bombo/i)).toBeVisible();
  await expect(article.getByText(/compás B — ocho corcheas de bombo/i)).toBeVisible();
  await expect(article.getByText(/TIEMPO \/ SONIDO \/ RETORNO \/ TENSIÓN \/ EQUILIBRIO/)).toBeVisible();
  await expect(article.getByText(/BPM es una condición de práctica, no una nota/)).toBeVisible();
  await expectPracticeCheckIn(page);
});

test('F4 U3 L4 renders substitution without layering or H4 certification', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/sustitucion-manos-bombo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sustitución: una nota de manos pasa al bombo' })).toBeVisible();
  await expectScoresReady(page);
  const article = page.locator('article.course-article');
  await expect(article.getByText(/no se añade como una capa extra/i)).toBeVisible();
  await expect(article.getByText(/A → B → A/).first()).toBeVisible();
  await expect(article.getByText(/no se añaden ataques/i)).toBeVisible();
  await expect(article.getByText(/no certifica H4/i)).toBeVisible();
  await expect(article.getByText(/distingues sustitución de superposición/i)).toBeVisible();
});

test('F4 U3 checkpoint renders both scores and certifies only H2 minimum', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-3/bombo-primera-voz-pie/');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkpoint — Bombo disponible como primera voz de pie' })).toBeVisible();
  await expectScoresReady(page, 2);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(article.getByText(/no existe BPM de aprobado/i)).toBeVisible();
  await expect(article.getByText(/H3 — hi-hat de pie/)).toBeVisible();
  await expect(article.getByText(/H4 — coordinación básica de cuatro extremidades/)).toBeVisible();
  await expect(article.getByText(/H5 — groove/)).toBeVisible();
  await expect(article.getByText(/doble pedal/)).toBeVisible();
  await expect(article.getByText(/La perfección no es requisito para continuar/)).toBeVisible();
});

test('F4 U2 checkpoint remains manual-only when U3 introduces kick', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-4-unidad-2/misma-idea-varias-superficies/');
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'MÍNIMO PARA AVANZAR A U3/U4' })).toBeVisible();
  await expect(article.getByText(/H2 — técnica de bombo/)).toBeVisible();
  await expect(page.getByText(/sin exigir todavía pies, groove o cuatro extremidades/i).first()).toBeVisible();
});
