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

test('Phase 2 U1 L4 protects first sight, keeps dictation answers hidden and delays recovery playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/oido-escritura-y-primera-vista/');

  await expect(page.getByRole('heading', { level: 1, name: 'Oído, escritura y primera vista' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: '3. Primera vista controlada' })).toBeVisible();
  await expect(page.getByText('PRECISIÓN:', { exact: false })).toBeVisible();
  await expect(page.getByText('CONTINUIDAD / RECUPERACIÓN:', { exact: false })).toBeVisible();

  const dictations = page.locator('[data-rhythm-dictation]');
  await expect(dictations).toHaveCount(2);
  for (const dictation of await dictations.all()) {
    const answer = dictation.locator('[data-dictation-answer-text]');
    await expect(answer).toBeHidden();
    await dictation.getByRole('button', { name: 'Mostrar respuesta' }).click();
    await expect(answer).toBeVisible();
    await expect(answer).not.toHaveText('');
  }

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const firstSight = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(firstSight).toHaveCount(1);
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

test('Phase 2 U1 L4 keeps the 3+3+2 window non-blocking and inside 4/4', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-1/oido-escritura-y-primera-vista/');

  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: '5. AMPLIACIÓN / VENTANA' })).toBeVisible();
  await expect(page.getByText('3 + 3 + 2', { exact: true })).toBeVisible();
  await expect(page.getByText('siguen siendo 4/4', { exact: false })).toBeVisible();
  await expect(page.getByText('No lo evalúes ni lo uses como requisito', { exact: false })).toBeVisible();
});
