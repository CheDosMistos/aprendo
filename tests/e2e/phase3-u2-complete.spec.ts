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

test('Phase 3 U2 overview exposes segmentation and keeps transcription in U3', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-2/');
  await expect(page.getByRole('heading', { level: 1, name: 'Oído rítmico activo: imitar, segmentar y dictar' })).toBeVisible();
  await expect(page.getByText('ESCUCHAR → SEGMENTAR → IMITAR → REPRESENTAR → TOCAR → COMPARAR → DIAGNOSTICAR', { exact: true })).toBeVisible();
  await expect(page.getByText(/E6 — transcripción iterativa de una fuente — empieza en U3/)).toBeVisible();
});

test('U2 L1 unlocks chunks only after a full listen and counts help separately', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-2/escuchar-por-partes/');

  const widget = page.locator('.rhythm-dictation');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-pattern', '11001101');
  await expect(widget).toHaveAttribute('data-listen-count', '0');
  await expect(widget).toHaveAttribute('data-chunk-listen-count', '0');

  const chunks = widget.locator('[data-dictation-chunk-play]');
  await expect(chunks).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) await expect(chunks.nth(index)).toBeDisabled();
  await expect(widget.locator('[data-dictation-answer-score]')).toHaveCount(0);

  await widget.getByRole('button', { name: 'Escuchar dictado' }).click();
  await expect(widget).toHaveAttribute('data-listen-count', '1');
  await expect(widget.locator('[data-dictation-listen-count]')).toHaveText('Escuchas completas: 1 · chunks: 0');
  for (let index = 0; index < 4; index += 1) await expect(chunks.nth(index)).toBeEnabled();

  await chunks.nth(2).click();
  await expect(widget).toHaveAttribute('data-chunk-listen-count', '1');
  await expect(widget.locator('[data-dictation-listen-count]')).toHaveText('Escuchas completas: 1 · chunks: 1');
  await expect(chunks.nth(2)).toHaveText('Pulso 3 · 1');

  await widget.getByRole('button', { name: 'Mostrar respuesta' }).click();
  const answerScore = widget.locator('[data-dictation-answer-score]');
  await expect(answerScore).toHaveCount(1);
  await expect(answerScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
});

test('U2 L3 compares equal-density strategies without chunk controls', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-2/escribir-durante-o-despues/');

  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets).toHaveCount(2);
  await expect(widgets.nth(0)).toHaveAttribute('data-pattern', '11100101');
  await expect(widgets.nth(1)).toHaveAttribute('data-pattern', '10101110');
  await expect(page.locator('[data-dictation-chunk-play]')).toHaveCount(0);
  await expect(page.locator('[data-dictation-answer-score]')).toHaveCount(0);
  await expect(page.getByText(/no demuestra.*siempre mejor/i)).toBeVisible();
});

test('U2 checkpoint separates sixteenth-note resolution from two-measure length', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-2/puerta-e3-e4-transcripcion/');

  const widgets = page.locator('.rhythm-dictation');
  await expect(widgets).toHaveCount(2);
  await expect(widgets.nth(0)).toHaveAttribute('data-subdivision', '4');
  await expect(widgets.nth(0)).toHaveAttribute('data-pattern', '1010000100101000');
  await expect(widgets.nth(0).locator('[data-dictation-chunk-play]')).toHaveCount(4);
  await expect(widgets.nth(1)).toHaveAttribute('data-subdivision', '2');
  await expect(widgets.nth(1)).toHaveAttribute('data-pattern', '1001101010011001');
  await expect(widgets.nth(1).locator('[data-dictation-chunk-play]')).toHaveCount(2);
  await expect(page.getByText(/no es una transcripción/i)).toBeVisible();
  await expect(page.getByText(/AVANZADO no es requisito para continuar/i)).toBeVisible();
});
