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

test('Phase 3 U4 overview exposes structural listening and preserves Hito 3 wording', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/');
  await expect(page.getByRole('heading', { level: 1, name: 'Frase, forma y mapa de canción' })).toBeVisible();
  await expect(page.getByText('ESCUCHAR TODO → PROPONER UNIDADES → RELACIONAR → LOCALIZAR LÍMITES → MAPEAR → ANTICIPAR → COMPROBAR', { exact: true })).toBeVisible();
  await expect(page.getByText(/2 \/ 4 \/ 8 \/ 16 no son una ley/i)).toBeVisible();
  await expect(page.getByText('leer → cantar → tocar → escuchar → escribir', { exact: true })).toBeVisible();
  await expect(page.getByText(/No cierra Fase 3/)).toBeVisible();
});

test('U4 L1 unlocks block help only after a full listen and reveals the map lazily', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/de-la-celula-a-la-frase/');

  const widget = page.locator('.rhythm-form');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-form-full-listen-count', '0');
  await expect(widget).toHaveAttribute('data-form-block-listen-count', '0');
  const blocks = widget.locator('[data-form-block]');
  await expect(blocks).toHaveCount(2);
  await expect(blocks.nth(0)).toBeDisabled();
  await expect(blocks.nth(1)).toBeDisabled();
  await expect(widget.locator('[data-form-answer-text]')).toBeHidden();

  await widget.getByRole('button', { name: 'Escuchar fuente completa' }).click();
  await expect(widget).toHaveAttribute('data-form-full-listen-count', '1');
  await expect(widget.locator('[data-form-counts]')).toHaveText('Completas: 1 · bloques: 0');
  await expect(blocks.nth(0)).toBeEnabled();
  await expect(blocks.nth(1)).toBeEnabled();

  await blocks.nth(1).click();
  await expect(widget).toHaveAttribute('data-form-block-listen-count', '1');
  await expect(blocks.nth(1)).toHaveText('Bloque 2 · 1');

  await widget.getByRole('button', { name: 'Mostrar mapa de referencia' }).click();
  await expect(widget.locator('[data-form-answer-text]')).toContainText('A = compases 1–4');
  await expect(widget.locator('[data-form-answer-text]')).toContainText('A’ = compases 5–8');
});

test('U4 L2 deliberately uses a seven-bar form and four unequal blocks', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/repeticion-contraste-y-transicion/');
  const widget = page.locator('.rhythm-form');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-block-lengths', '2|2|1|2');
  await expect(widget.locator('[data-form-status]')).toContainText('7 compases');
  await expect(widget.locator('[data-form-block]')).toHaveCount(4);
  await expect(page.getByText(/EXPECTATIVA → COMPROBACIÓN AUDITIVA/)).toBeVisible();
});

test('U4 L3 compares recurrent, persistent, pickup and fill-function sources', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/riff-ostinato-pickup-y-fill-como-funcion/');
  await expect(page.locator('.rhythm-form')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'D. Densidad sin transición' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'E. Densidad con función de transición' })).toBeVisible();
  await expect(page.getByText(/No toda frase densa es un fill/)).toBeVisible();
});

test('U4 L4 exposes a five-block map for anticipation practice', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/construir-y-usar-un-mapa-de-forma/');
  const widget = page.locator('.rhythm-form');
  await expect(widget).toHaveAttribute('data-block-lengths', '2|2|1|3|2');
  await expect(widget.locator('[data-form-block]')).toHaveCount(5);
  await expect(page.getByText('OÍR → MAPEAR → ANTICIPAR → COMPROBAR', { exact: true })).toBeVisible();
});

test('Checkpoint 3A keeps the fresh reading score silent and reveals the heard variant only after listening work', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-4/checkpoint-3a-hito-global-3/');

  await expect(page.getByText('leer → cantar → tocar → escuchar → escribir', { exact: true })).toBeVisible();
  const readOnly = page.locator('[data-hito-read-only]');
  const readScore = readOnly.locator('[data-notation-score]');
  await expect(readScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(readOnly.locator('.course-score__play')).toBeHidden();

  const dictation = page.locator('.rhythm-dictation');
  await expect(dictation).toHaveCount(1);
  await expect(dictation).toHaveAttribute('data-pattern', '1011010010110101');
  await expect(dictation.locator('[data-dictation-answer-score]')).toHaveCount(0);
  const chunks = dictation.locator('[data-dictation-chunk-play]');
  await expect(chunks).toHaveCount(2);
  await expect(chunks.nth(0)).toBeDisabled();

  await dictation.getByRole('button', { name: 'Escuchar dictado' }).click();
  await expect(chunks.nth(0)).toBeEnabled();
  await expect(chunks.nth(1)).toBeEnabled();

  await dictation.getByRole('button', { name: 'Mostrar respuesta' }).click();
  const answerScore = dictation.locator('[data-dictation-answer-score]');
  await expect(answerScore).toHaveCount(1);
  await expect(answerScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(page.getByText(/AVANZADO no es requisito/)).toBeVisible();
});

test('U3 transcription behavior remains separate after adding U4 form listening', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-3-unidad-3/slowdown-diagnostico/');
  await expect(page.locator('.rhythm-form')).toHaveCount(0);
  const transcription = page.locator('.rhythm-transcription');
  await expect(transcription).toHaveCount(1);
  await expect(transcription.getByRole('button', { name: 'Escuchar al 80 %' })).toBeDisabled();
  await expect(transcription.locator('[data-transcription-counts]')).toHaveText('100 %: 0 · chunks: 0 · 80 %: 0');
});
