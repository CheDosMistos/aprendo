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

test('Phase 2 U3 L1 renders tied-note practice and protects both score playbacks until attempted', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/ataque-y-duracion-la-ligadura-elimina-el-nuevo-ataque/');

  await expect(page.getByRole('heading', { level: 1, name: 'Ataque y duración: la ligadura elimina el nuevo ataque' })).toBeVisible();
  await expect(page.getByText('ATAQUE ≠ DURACIÓN ≠ PULSO', { exact: false }).first()).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const protectedScores = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(protectedScores).toHaveCount(2);
  for (const score of await protectedScores.all()) {
    await expect(score.locator('.course-score__play')).toBeHidden();
    await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  }

  const newScore = scores.last();
  await expect(newScore.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u3/f2-u3-l1-ataque-duracion-ligaduras.musicxml');
  await expect(newScore.locator('.course-score__shell')).toBeVisible();
  await newScore.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(newScore).toHaveAttribute('data-feedback-locked', 'false');
  await expect(newScore.locator('.course-score__play')).toBeVisible();
});

test('Phase 2 U3 L1 hearing distinguishes reattack without pretending audio proves written duration', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/ataque-y-duracion-la-ligadura-elimina-el-nuevo-ataque/');

  await expect(page.locator('h2').filter({ hasText: '4. Oído breve' })).toBeVisible();
  await expect(page.getByText('el oído por sí solo no puede demostrar', { exact: false })).toBeVisible();

  const dictation = page.locator('.rhythm-dictation');
  await expect(dictation).toHaveCount(1);
  await expect(dictation.getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();

  const answer = dictation.locator('[data-dictation-answer-text]');
  await expect(answer).toBeHidden();
  await dictation.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(answer).toBeVisible();
  await expect(answer).toContainText('Opción A — hay un solo ataque');

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige cero errores, un BPM concreto', { exact: false })).toBeVisible();
  await expect(page.getByText('La siguiente lección introduce', { exact: false })).toBeVisible();
  await expect(page.getByText('el puntillo', { exact: false }).last()).toBeVisible();
});
