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

test('Phase 3 U1 overview exposes the representation loop and boundaries', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-1/');
  await expect(page.getByRole('heading', { level: 1, name: 'Del código al lenguaje' })).toBeVisible();
  await expect(page.getByText('OÍR ↔ IMITAR ↔ ESCRIBIR ↔ LEER/TOCAR ↔ COMPARAR ↔ EXPLICAR', { exact: true })).toBeVisible();
  await expect(page.getByText(/Su trabajo estructurado empieza en U3/)).toBeVisible();
});

test('U1 L1 keeps the auditory notation answer absent until reveal while its resources preload', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-1/una-idea-varias-representaciones/');

  const visual = page.locator('.course-score').filter({ hasText: '30.U1.L1 — lectura visual A' });
  await expect(visual.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });

  const widget = page.locator('.rhythm-dictation');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-pattern', '11010011');
  await expect(widget).toHaveAttribute('data-listen-count', '0');
  await expect(widget.locator('[data-dictation-listen-count]')).toHaveText('Escuchas: 0');

  const answerScore = widget.locator('[data-dictation-answer-score]');
  await expect(answerScore).toHaveCount(0);

  await widget.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(answerScore).toHaveCount(1);
  await expect(answerScore).toBeVisible();
  await expect(answerScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(widget.locator('[data-dictation-answer-text]')).toBeVisible();
});

test('U1 checkpoint keeps auditory answer hidden and protects the visual first attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-1/puerta-representacion-bidireccional/');

  const widget = page.locator('.rhythm-dictation');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-pattern', '11001011');
  await expect(widget.locator('[data-dictation-answer-score]')).toHaveCount(0);

  const protectedScore = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(protectedScore).toHaveCount(1);
  await expect(protectedScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(protectedScore).toHaveAttribute('data-study-hidden', 'true');
  await expect(protectedScore.getByRole('button', { name: 'Empezar' })).toBeVisible();
  await expect(protectedScore.locator('.course-score__play')).toBeHidden();

  await protectedScore.getByRole('button', { name: 'Empezar' }).click();
  await expect(protectedScore).toHaveAttribute('data-study-hidden', 'false');
  await expect(protectedScore.getByRole('button', { name: 'Finalizar intento' })).toBeVisible();
});
