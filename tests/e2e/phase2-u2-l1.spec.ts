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

test('Phase 2 U2 L1 renders the four-slot score and keeps U1 recovery playback behind the attempt gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/la-rejilla-de-cuatro-posiciones/');

  await expect(page.getByRole('heading', { level: 1, name: 'La rejilla de cuatro posiciones' })).toBeVisible();
  await expect(page.getByText('El silencio elimina un ataque, no la posición temporal', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const recovery = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(recovery).toHaveCount(1);
  await expect(recovery.locator('.course-score__play')).toBeHidden();
  const enableAudio = recovery.getByRole('button', { name: 'Habilitar audio' });
  await expect(enableAudio).toBeVisible();
  await enableAudio.click();
  await expect(recovery).toHaveAttribute('data-feedback-locked', 'false');
  await expect(recovery.locator('.course-score__play')).toBeVisible();

  const u2Score = page.locator('.course-score').filter({ has: page.getByRole('link', { name: 'MusicXML — fuente del ejercicio' }) }).last();
  await expect(u2Score).toBeVisible();
  await expect(u2Score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(u2Score.locator('.course-score__shell')).toBeVisible();
  await expect(u2Score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u2/f2-u2-rejilla-cuatro-posiciones.musicxml');
});

test('Phase 2 U2 L1 exposes a four-subdivision hearing task and evidence-based progression', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/la-rejilla-de-cuatro-posiciones/');

  await expect(page.locator('h2').filter({ hasText: '4. Oído breve' })).toBeVisible();

  const dictations = page.locator('.rhythm-dictation');
  await expect(dictations).toHaveCount(1);
  const dictation = dictations.first();
  const answer = 'Opción A — en el segundo pulso también hay ataque en la tercera posición (&); la opción B deja esa posición en silencio.';
  await expect(dictation.getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();
  await expect(dictation.getByText(answer, { exact: true })).toBeHidden();
  await dictation.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(dictation.getByText(answer, { exact: true })).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige un BPM concreto', { exact: false })).toBeVisible();
  await expect(page.getByText('La siguiente lección abrirá C3 de forma prudente', { exact: false })).toBeVisible();
  await expect(page.getByText('cambiar entre 2 y 4 subdivisiones por pulso', { exact: false })).toBeVisible();
});
