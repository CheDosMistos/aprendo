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

test('Phase 2 U3 L4 renders protected retrieval and real dictation durations', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/oir-escribir-y-transformar-duracion/');

  await expect(page.getByRole('heading', { level: 1, name: 'Oír, escribir y transformar duración' })).toBeVisible();
  await expect(page.getByText('Primero identifica qué ataques oyes', { exact: false })).toBeVisible();

  const recovery = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(recovery).toHaveCount(1);
  await expect(recovery.locator('.course-score__play')).toBeHidden();
  await expect(recovery.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(recovery.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u3/f2-u3-l3-sincopa-i.musicxml');

  const dictations = page.locator('.rhythm-dictation');
  await expect(dictations).toHaveCount(3);
  await expect(dictations.nth(0).locator('[data-dictation-status]')).toHaveText('4 pulsos de entrada y después 1 pulso. Escribe antes de revelar.');
  await expect(dictations.nth(1).locator('[data-dictation-status]')).toHaveText('4 pulsos de entrada y después 1 pulso. Escribe antes de revelar.');
  await expect(dictations.nth(2).locator('[data-dictation-status]')).toHaveText('4 pulsos de entrada y después 2 pulsos. Escribe antes de revelar.');

  const firstAnswer = 'X · — un pulso: hay un ataque en 1 y no existe un nuevo ataque en &. El audio por sí solo no decide si esa segunda posición se escribirá como continuación ligada o como silencio.';
  await expect(dictations.first().getByText(firstAnswer, { exact: true })).toBeHidden();
  await dictations.first().getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(dictations.first().getByText(firstAnswer, { exact: true })).toBeVisible();
});

test('Phase 2 U3 L4 keeps hearing evidence separate from written duration and exposes the checkpoint boundary', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/oir-escribir-y-transformar-duracion/');

  await expect(page.locator('h2').filter({ hasText: '2. OÍR → IDENTIFICAR' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. OÍR → ESCRIBIR' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '4. ESCRIBIR → TOCAR' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '5. TRANSFORMAR' })).toBeVisible();

  await expect(page.getByText('no demuestra por sí solo si esa posición está escrita como una ligadura o como un silencio', { exact: false })).toBeVisible();
  await expect(page.getByText('El audio informa sobre ataques; la notación añade información sobre duración escrita', { exact: false })).toBeVisible();
  await expect(page.getByText('No se contará como evidencia de oído', { exact: false })).toBeVisible();
  await expect(page.getByText('cambia una sola variable', { exact: false })).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige un BPM concreto, caligrafía perfecta', { exact: false })).toBeVisible();
  await expect(page.getByText('no declara E4 FUNCIONAL de forma global', { exact: false })).toBeVisible();
  await expect(page.getByText('20.U3.CP — Puerta de duración y síncopa I', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente', { exact: false })).toBeVisible();
});
