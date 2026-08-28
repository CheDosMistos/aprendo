import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, {
      form: { username, password },
      headers: { Origin: baseUrl },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    const match = /(?:^|,\s*)aprendo_session=([^;]+)/i.exec(response.headers()['set-cookie'] ?? '');
    expect(match?.[1]).toBeTruthy();
    const url = new URL(baseUrl);
    await page.context().addCookies([{
      name: 'aprendo_session', value: match![1], domain: url.hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Strict',
    }]);
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('Phase 2 U7 L3 renders both written hierarchy contrasts with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/simple-o-compuesto-justificar-la-jerarquia/');

  await expect(page.getByRole('heading', { level: 1, name: 'Simple o compuesto: justificar la jerarquía' })).toBeVisible();
  await expect(page.getByText('LA PREGUNTA CENTRAL NO ES «¿CUÁNTAS CORCHEAS HAY?», SINO «¿CUÁNTAS SUBDIVISIONES ORDINARIAS ORGANIZAN CADA PULSO PRINCIPAL?».', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);
  for (let i = 0; i < 2; i += 1) {
    const score = scores.nth(i);
    await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
    await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
    await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
    await expect(score.locator('.course-score__play')).toBeHidden();
    await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  }

  await expect(scores.nth(0).getByRole('link', { name: 'MusicXML — fuente del contraste 3/4–9/8' })).toHaveAttribute('href', '/bateria/notation/f2/u7/f2-u7-l3-3-4-vs-9-8.musicxml');
  await expect(scores.nth(1).getByRole('link', { name: 'MusicXML — fuente del contraste 4/4–12/8' })).toHaveAttribute('href', '/bateria/notation/f2/u7/f2-u7-l3-4-4-vs-12-8.musicxml');

  await scores.nth(0).getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(scores.nth(0)).toHaveAttribute('data-feedback-locked', 'false');
  await expect(scores.nth(0).locator('.course-score__play')).toBeVisible();
});

test('Phase 2 U7 L3 exposes the controlled 3x2/3x3 and 4x2/4x3 comparisons', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/simple-o-compuesto-justificar-la-jerarquia/');

  await expect(page.getByText('3/4 → 3×2 → SIMPLE', { exact: true })).toBeVisible();
  await expect(page.getByText('9/8 → 3×3 → COMPUESTO', { exact: true })).toBeVisible();
  await expect(page.getByText('4/4 → 4×2 → SIMPLE', { exact: true })).toBeVisible();
  await expect(page.getByText('12/8 → 4×3 → COMPUESTO', { exact: true })).toBeVisible();
  await expect(page.getByText('AGRUPACIÓN / REAGRUPACIÓN ≠ CAMBIO DE COMPÁS', { exact: true })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});

test('Phase 2 U7 L3 keeps E5 auditory work for L4 and exposes advancement criteria', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/simple-o-compuesto-justificar-la-jerarquia/');

  await expect(page.getByText('La clasificación auditiva E5 se reserva deliberadamente para L4.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L4' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'reconocimiento auditivo E5 general' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
