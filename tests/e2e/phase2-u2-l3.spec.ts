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

test('Phase 2 U2 L3 renders protected retrieval and keeps dictation answers hidden until requested', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/oir-imitar-y-escribir-la-rejilla/');

  await expect(page.getByRole('heading', { level: 1, name: 'Oír, imitar y escribir la rejilla' })).toBeVisible();
  await expect(page.getByText('Oír no es reconocer una respuesta que ya has visto', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);

  const recovery = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(recovery).toHaveCount(1);
  await expect(recovery.locator('.course-score__play')).toBeHidden();
  const enableAudio = recovery.getByRole('button', { name: 'Habilitar audio' });
  await expect(enableAudio).toBeVisible();
  await enableAudio.click();
  await expect(recovery).toHaveAttribute('data-feedback-locked', 'false');
  await expect(recovery.locator('.course-score__play')).toBeVisible();
  await expect(recovery.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u2/f2-u2-cambio-2-a-4-silencios.musicxml');

  const dictations = page.locator('.rhythm-dictation');
  await expect(dictations).toHaveCount(4);

  const first = dictations.first();
  const answer = 'X · X X — un pulso: ataque en 1, silencio en e, ataques en & y a.';
  await expect(first.getByRole('button', { name: 'Escuchar dictado' })).toBeVisible();
  await expect(first.getByText(answer, { exact: true })).toBeHidden();
  await first.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(first.getByText(answer, { exact: true })).toBeVisible();
});

test('Phase 2 U2 L3 exposes the approved hearing-to-writing cycle and multidimensional advancement criteria', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/oir-imitar-y-escribir-la-rejilla/');

  await expect(page.locator('h2').filter({ hasText: '2. OÍR → IMITAR' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. IMITAR → ESCRIBIR' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '4. ESCRIBIR → TOCAR' })).toBeVisible();
  await expect(page.getByText('No se contará como evidencia de oído', { exact: false })).toBeVisible();
  await expect(page.getByText('auditivo:', { exact: false }).last()).toBeVisible();
  await expect(page.getByText('memoria:', { exact: false }).last()).toBeVisible();
  await expect(page.getByText('escritura:', { exact: false }).last()).toBeVisible();
  await expect(page.getByText('ejecución:', { exact: false }).last()).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige un BPM concreto, caligrafía perfecta', { exact: false })).toBeVisible();
  await expect(page.getByText('no declara E4 FUNCIONAL de forma global', { exact: false })).toBeVisible();
  await expect(page.getByText('doubles/diddles sin alterar la arquitectura temporal', { exact: false })).toBeVisible();
});
