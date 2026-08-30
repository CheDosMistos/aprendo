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

test('Phase 3 U3 overview defines iterative E6 and explicit uncertainty', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-3/');
  await expect(page.getByRole('heading', { level: 1, name: 'Transcripción corta y método de verificación' })).toBeVisible();
  await expect(page.getByText('FUENTE → HIPÓTESIS → PREGUNTA → REESCUCHA → REVISIÓN → EJECUCIÓN → VALIDACIÓN', { exact: true })).toBeVisible();
  await expect(page.getByText(/Transcribir no significa hacer un dictado más largo/)).toBeVisible();
  await expect(page.getByText(/identificar qué parte es aproximación propia/i)).toBeVisible();
});

test('U3 L1 locks chunks until the first full source listen and lazy-reveals its skeleton', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-3/fuente-marco-hipotesis/');

  const widget = page.locator('.rhythm-transcription');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-full-listen-count', '0');
  await expect(widget).toHaveAttribute('data-chunk-listen-count', '0');
  const chunks = widget.locator('[data-transcription-chunk]');
  await expect(chunks).toHaveCount(2);
  await expect(chunks.nth(0)).toBeDisabled();
  await expect(chunks.nth(1)).toBeDisabled();
  await expect(widget.locator('[data-transcription-answer-score]')).toHaveCount(0);

  await widget.getByRole('button', { name: 'Escuchar fuente al 100 %' }).click();
  await expect(widget).toHaveAttribute('data-full-listen-count', '1');
  await expect(widget.locator('[data-transcription-counts]')).toHaveText('100 %: 1 · chunks: 0');
  await expect(chunks.nth(0)).toBeEnabled();
  await expect(chunks.nth(1)).toBeEnabled();

  await chunks.nth(1).click();
  await expect(widget).toHaveAttribute('data-chunk-listen-count', '1');
  await expect(chunks.nth(1)).toHaveText('Compás 2 · 1');

  await widget.getByRole('button', { name: 'Mostrar solución' }).click();
  const score = widget.locator('[data-transcription-answer-score]');
  await expect(score).toHaveCount(1);
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(widget.locator('[data-transcription-answer-text]')).toContainText('Esqueleto compuesto: 1110111011101110');
});

test('U3 L3 exposes 80 percent only after 100 percent and counts it separately', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-3/slowdown-diagnostico/');

  const widget = page.locator('.rhythm-transcription');
  const slow = widget.getByRole('button', { name: 'Escuchar al 80 %' });
  await expect(slow).toBeDisabled();
  await expect(widget.locator('[data-transcription-counts]')).toHaveText('100 %: 0 · chunks: 0 · 80 %: 0');

  await widget.getByRole('button', { name: 'Escuchar fuente al 100 %' }).click();
  await expect(slow).toBeEnabled();
  await expect(widget).toHaveAttribute('data-full-listen-count', '1');

  await slow.click();
  await expect(widget).toHaveAttribute('data-slow-listen-count', '1');
  await expect(widget.locator('[data-transcription-counts]')).toHaveText('100 %: 1 · chunks: 0 · 80 %: 1');
  await expect(widget.locator('[data-transcription-status]')).toContainText('vuelve a 100 % antes de validar');

  await widget.getByRole('button', { name: 'Escuchar fuente al 100 %' }).click();
  await expect(widget).toHaveAttribute('data-full-listen-count', '2');
});

test('U3 checkpoint keeps solution hidden and exposes independent E6 source with tracked aids', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-3/primera-evidencia-e6/');

  const widget = page.locator('.rhythm-transcription');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-low-pattern', '1001000010000100');
  await expect(widget).toHaveAttribute('data-mid-pattern', '0010001000101000');
  await expect(widget).toHaveAttribute('data-high-pattern', '0100010001000010');
  await expect(widget.locator('[data-transcription-chunk]')).toHaveCount(2);
  await expect(widget.getByRole('button', { name: 'Escuchar al 80 %' })).toBeDisabled();
  await expect(widget.locator('[data-transcription-answer-score]')).toHaveCount(0);
  await expect(page.getByText(/No hay un máximo universal de ayudas para aprobar/)).toBeVisible();
  await expect(page.getByText(/AVANZADO no es requisito para continuar/)).toBeVisible();
});

test('U2 dictation behavior still works after adding the separate transcription widget', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-2/escuchar-por-partes/');

  await expect(page.locator('.rhythm-transcription')).toHaveCount(0);
  const dictation = page.locator('.rhythm-dictation');
  await expect(dictation).toHaveCount(1);
  await expect(dictation.locator('[data-dictation-chunk-play]')).toHaveCount(4);
  await expect(dictation.locator('[data-dictation-listen-count]')).toHaveText('Escuchas completas: 0 · chunks: 0');
});
