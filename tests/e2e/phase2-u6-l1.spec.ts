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

test('Phase 2 U6 L1 renders a real 6/8 study with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/dos-pulsos-tres-subdivisiones-cada-uno/');

  await expect(page.getByRole('heading', { level: 1, name: 'Dos pulsos, tres subdivisiones cada uno' })).toBeVisible();
  await expect(page.getByText('6/8 PROTOTÍPICO = 2 PULSOS PRINCIPALES × 3 SUBDIVISIONES.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u6/f2-u6-l1-dos-pulsos-tres-subdivisiones.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U6 L1 separates compound meter from 4/4 triplets and six equal pulses', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/dos-pulsos-tres-subdivisiones-cada-uno/');

  await expect(page.locator('h2').filter({ hasText: '2. Qué significa 6/8 aquí' })).toBeVisible();
  await expect(page.getByText('COMPÁS 6/8 → 2 PULSOS PRINCIPALES → 3 CORCHEAS POR PULSO', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '6/8 no es “4/4 sin el 3 del tresillo”' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'lees una línea elemental en 6/8 sin contar por defecto seis pulsos equivalentes' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'distingues corcheas ordinarias de 6/8 de tresillos `3:2` en 4/4' })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});

test('Phase 2 U6 L1 makes metronome unit and progression criteria explicit without BPM gating', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/dos-pulsos-tres-subdivisiones-cada-uno/');

  await expect(page.locator('h2').filter({ hasText: '5. Metrónomo: la unidad importa' })).toBeVisible();
  await expect(page.locator('code').filter({ hasText: '♩. = 54' })).toBeVisible();
  await expect(page.getByText('Eso significa 54 pulsos principales por minuto.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L2' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'un BPM fijo o alto' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'actualizar automáticamente D4 o F2 por completar esta página' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
