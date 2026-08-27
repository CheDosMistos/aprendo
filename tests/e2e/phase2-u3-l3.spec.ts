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

test('Phase 2 U3 L3 renders elementary syncopation and keeps both scores behind the attempt gate', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/sincopa-i-ataque-desplazado-marco-estable/');

  await expect(page.getByRole('heading', { level: 1, name: 'Síncopa I: ataque desplazado, marco estable' })).toBeVisible();
  await expect(page.getByText('La síncopa puede cambiar dónde sentimos tensión sin cambiar el pulso ni el compás', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const lockedScores = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(lockedScores).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const score = lockedScores.nth(index);
    await expect(score.locator('.course-score__play')).toBeHidden();
    await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  }

  const newScore = page.locator('.course-score').filter({ has: page.getByRole('link', { name: 'MusicXML — fuente del ejercicio' }) }).last();
  await expect(newScore.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u3/f2-u3-l3-sincopa-i.musicxml');

  await newScore.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(newScore).toHaveAttribute('data-feedback-locked', 'false');
  await expect(newScore.locator('.course-score__play')).toBeVisible();
});

test('Phase 2 U3 L3 exposes stable-meter reasoning, separate continuity evidence and the U4 boundary', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/sincopa-i-ataque-desplazado-marco-estable/');

  await expect(page.locator('h2').filter({ hasText: '2. NÚCLEO' })).toBeVisible();
  await expect(page.getByText('No definimos “síncopa” como cualquier ataque débil aislado', { exact: false })).toBeVisible();
  await expect(page.getByText('no golpeas en `3`', { exact: false })).toBeVisible();

  await expect(page.locator('h2').filter({ hasText: '3. Continuidad' })).toBeVisible();
  await expect(page.getByText('PRECISIÓN:', { exact: false })).toBeVisible();
  await expect(page.getByText('CONTINUIDAD:', { exact: false })).toBeVisible();
  await expect(page.getByText('RECUPERACIÓN:', { exact: false })).toBeVisible();
  await expect(page.getByText('COMPRENSIÓN:', { exact: false })).toBeVisible();

  await expect(page.locator('h2').filter({ hasText: '4. Transformación' })).toBeVisible();
  await expect(page.getByText('Cambia sólo la posición del ataque', { exact: false })).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige cero errores, un BPM fijo/alto', { exact: false })).toBeVisible();
  await expect(page.getByText('La siguiente lección cambiará de representación', { exact: false })).toBeVisible();
  await expect(page.getByText('OÍR → IDENTIFICAR → ESCRIBIR → TOCAR → TRANSFORMAR', { exact: false })).toBeVisible();
  await expect(page.getByText('U4 ampliará la variedad', { exact: false })).toBeVisible();

  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
