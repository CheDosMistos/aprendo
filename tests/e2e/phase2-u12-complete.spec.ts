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

async function expectProtected(score: ReturnType<Page['locator']>): Promise<void> {
  await expect(score).toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'true');
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Empezar' })).toBeVisible();
}

async function completeFirstAttempt(score: ReturnType<Page['locator']>): Promise<void> {
  await score.getByRole('button', { name: 'Empezar' }).click();
  await expect(score).toHaveAttribute('data-first-sight-started', 'true');
  await expect(score.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'false');
  await expect(score.locator('.course-score__play')).toBeHidden();
  await score.getByRole('button', { name: 'Finalizar intento' }).click();
  await expect(score).toHaveAttribute('data-first-sight-completed', 'true');
  await expect(score.locator('.course-score__play')).toBeVisible();
}

test('U12 overview defines Hito 2, exclusive checkpoint assets and Phase 3 bridge', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-12/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hito 2 y puente a Fase 3' })).toBeVisible();
  await expect(page.getByText('Leer y reproducir material rítmico nuevo sin depender de que el patrón haya sido previamente memorizado.', { exact: true })).toBeVisible();
  await expect(page.getByText(/checkpoint usa dos assets exclusivos C y D/)).toBeVisible();
  await expect(page.getByText(/Cerrar Fase 2 no borra debilidades/)).toBeVisible();
});

test('U12 training samples stay protected until the first attempt and diagnostic answer starts hidden', async ({ page }, testInfo) => {
  await login(page, testInfo);
  const lessons = [
    ['/bateria/fase-2-unidad-12/muestra-protegida-a-4-4/', 'Muestra protegida A: métrica simple conocida'],
    ['/bateria/fase-2-unidad-12/muestra-protegida-b-6-8/', 'Muestra protegida B: métrica compuesta conocida'],
  ] as const;
  for (const [route, heading] of lessons) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const score = page.locator('.course-score[data-score-first-sight="true"]');
    await expect(score).toHaveCount(1);
    await expectProtected(score);
  }
  await page.goto(lessons[0][0]);
  await completeFirstAttempt(page.locator('.course-score[data-score-first-sight="true"]'));

  await page.goto('/bateria/fase-2-unidad-12/diagnostico-adicional-y-puente-fase-3/');
  const dictation = page.locator('.rhythm-dictation');
  await expect(dictation).toHaveCount(1);
  await expect(dictation).toHaveAttribute('data-pattern', '10100110');
  await expect(dictation.locator('[data-dictation-answer-text]')).toBeHidden();
});

test('U12 checkpoint exposes two independent protected samples and preserves qualitative closure', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-12/hito-2-alfabetizacion-ritmica/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hito 2 — alfabetización rítmica' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'INFERENCIA' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'EVIDENCIA CENTRAL' })).toBeVisible();
  const scores = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(scores).toHaveCount(2);
  await expectProtected(scores.nth(0));
  await expectProtected(scores.nth(1));
  await expect(scores.nth(0).getByRole('link', { name: 'MusicXML — fuente de la muestra exclusiva C' })).toBeVisible();
  await expect(scores.nth(1).getByRole('link', { name: 'MusicXML — fuente de la muestra exclusiva D' })).toBeVisible();
  await completeFirstAttempt(scores.nth(0));
  await expect(scores.nth(1).locator('.course-score__play')).toBeHidden();
  await completeFirstAttempt(scores.nth(1));
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA CERRAR FASE 2' })).toBeVisible();
  await expect(page.getByText(/no convierte automáticamente C1–C3, D1–D5 o F1–F2 en FUNCIONALES/)).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
