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

test('Phase 2 U2 checkpoint protects the exclusive new sample and keeps the dictation answer hidden', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/puerta-de-semicorcheas-y-silencios/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de semicorcheas y silencios' })).toBeVisible();
  await expect(page.getByText('¿D1/C2 y el inicio de C3 permiten avanzar hacia U3', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(2);

  const firstSight = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(firstSight).toHaveCount(1);
  await expect(firstSight.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'true');
  await expect(firstSight.locator('.course-score__play')).toBeHidden();
  await expect(firstSight.getByRole('button', { name: 'Empezar' })).toBeVisible();

  await firstSight.getByRole('button', { name: 'Empezar' }).click();
  await expect(firstSight.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'false');
  await expect(firstSight.locator('.course-score__play')).toBeHidden();
  await expect(firstSight.getByRole('button', { name: 'Finalizar intento' })).toBeVisible();

  await firstSight.getByRole('button', { name: 'Finalizar intento' }).click();
  await expect(firstSight).toHaveAttribute('data-first-sight-completed', 'true');
  await expect(firstSight.locator('.course-score__play')).toBeVisible();
  await expect(firstSight.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u2/f2-u2-checkpoint-a.musicxml');

  const dictation = page.locator('.rhythm-dictation');
  await expect(dictation).toHaveCount(1);
  await expect(dictation.locator('[data-dictation-status]')).toContainText('2 pulsos');
  const answer = dictation.locator('[data-dictation-answer-text]');
  await expect(answer).toBeHidden();
  await dictation.getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(answer).toBeVisible();
  await expect(answer).toContainText('X · X · | · X X ·');
});

test('Phase 2 U2 checkpoint uses recent 2↔4 evidence selectively and keeps progression multidimensional', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/puerta-de-semicorcheas-y-silencios/');

  await expect(page.locator('h2').filter({ hasText: '4. Evidencia reciente 2 ↔ 4' })).toBeVisible();
  await expect(page.getByText('reutilízala', { exact: false })).toBeVisible();

  const recovery = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(recovery).toHaveCount(1);
  await expect(recovery.locator('.course-score__play')).toBeHidden();
  await expect(recovery.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A U3' })).toBeVisible();
  for (const criterion of ['C3 funcional;', 'PAS adicionales;', 'síncopa formalmente dominada;', 'primera vista avanzada.']) {
    await expect(page.locator('li').filter({ hasText: new RegExp(`^${criterion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })).toBeVisible();
  }

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    await expect(page.getByRole('heading', { level: 3, name: decision, exact: true })).toBeVisible();
  }
});

test('Phase 2 U2 checkpoint exposes health/load stop signals without conflating them with curriculum failure', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-2/puerta-de-semicorcheas-y-silencios/');

  for (const signal of ['dolor;', 'hormigueo;', 'entumecimiento;', 'pérdida de fuerza;', 'tensión persistente.']) {
    await expect(page.locator('li').filter({ hasText: new RegExp(`^${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })).toBeVisible();
  }
  await expect(page.getByText('Completar este checkpoint', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente D1, C2, C3, E4', { exact: false })).toBeVisible();
});
