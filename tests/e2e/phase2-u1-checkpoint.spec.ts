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
      name: 'aprendo_session',
      value: match![1],
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
    }]);
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('Phase 2 U1 checkpoint protects the new sample and delays recovery playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/puerta-de-fluidez-binaria/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de fluidez binaria' })).toBeVisible();
  await expect(page.getByText('no sirve para “aprobar U1”', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: '1. Muestra A — lectura nueva' })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const firstSight = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(firstSight).toHaveCount(1);
  await expect(firstSight.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u1/f2-u1-checkpoint-a.musicxml');

  const firstSightShell = firstSight.locator('.course-score__shell');
  const firstSightPlay = firstSight.locator('.course-score__play');
  await expect(firstSightShell).toHaveAttribute('aria-hidden', 'true');
  await expect(firstSightPlay).toBeHidden();
  await expect(firstSight.getByRole('button', { name: 'Empezar' })).toBeVisible();

  await firstSight.getByRole('button', { name: 'Empezar' }).click();
  await expect(firstSightShell).toHaveAttribute('aria-hidden', 'false');
  await expect(firstSightPlay).toBeHidden();
  await expect(firstSight.getByRole('button', { name: 'Finalizar intento' })).toBeVisible();

  await firstSight.getByRole('button', { name: 'Finalizar intento' }).click();
  await expect(firstSight).toHaveAttribute('data-first-sight-completed', 'true');
  await expect(firstSightPlay).toBeVisible();

  const recovery = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(recovery).toHaveCount(1);
  const recoveryPlay = recovery.locator('.course-score__play');
  await expect(recoveryPlay).toBeHidden();
  const enableAudio = recovery.getByRole('button', { name: 'Habilitar audio' });
  await expect(enableAudio).toBeVisible();
  await enableAudio.click();
  await expect(recovery).toHaveAttribute('data-feedback-locked', 'false');
  await expect(recoveryPlay).toBeVisible();
});

test('Phase 2 U1 checkpoint exposes conceptual, health and progression decisions without a BPM pass gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/puerta-de-fluidez-binaria/');

  await expect(page.getByText('¿Dónde estás subdividiendo aunque haya silencio?', { exact: false })).toBeVisible();
  await expect(page.getByText('BPM describe la condición, no el nivel', { exact: false })).toBeVisible();
  await expect(page.getByText('dolor', { exact: false })).toBeVisible();
  await expect(page.getByText('tensión persistente', { exact: false })).toBeVisible();

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    await expect(page.getByRole('heading', { level: 3, name: decision })).toBeVisible();
  }

  await expect(page.getByText('Completar el checkpoint:', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente C1/C2/D1/F1', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Puente a 20.U2' })).toBeVisible();
  await expect(page.getByText('cuánta novedad tiene sentido introducir', { exact: false })).toBeVisible();
});
