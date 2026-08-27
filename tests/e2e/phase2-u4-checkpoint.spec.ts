import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, {
      form: { username, password }, headers: { Origin: baseUrl }, maxRedirects: 0,
    });
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

test('Phase 2 U4 checkpoint protects its exclusive sample and releases playback only after the first attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/puerta-de-sincopa-aplicada-y-continuidad/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de síncopa aplicada y continuidad' })).toBeVisible();
  await expect(page.getByText('¿D2 y C1–C3 están suficientemente disponibles para abrir U5', { exact: false })).toBeVisible();

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
  await expect(firstSight.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u4/f2-u4-checkpoint-a.musicxml');
});

test('Phase 2 U4 checkpoint keeps accent, recovery and B7 evidence separated before opening U5', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/puerta-de-sincopa-aplicada-y-continuidad/');

  await expect(page.locator('h2').filter({ hasText: '2. Explicación conceptual: acento ≠ ritmo' })).toBeVisible();
  await expect(page.getByText('ACENTO ≠ RITMO', { exact: true })).toBeVisible();
  await expect(page.getByText('mapa temporal', { exact: true })).toBeVisible();
  await expect(page.getByText('mapa dinámico', { exact: true })).toBeVisible();
  await expect(page.getByText('B7 no es la inferencia principal de este checkpoint', { exact: false })).toBeVisible();
  await expect(page.getByText('No se exige B7 funcional global para abrir U5', { exact: false })).toBeVisible();

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    await expect(page.getByRole('heading', { level: 3, name: decision, exact: true })).toBeVisible();
  }

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA ABRIR U5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'D5 funcional o primera vista avanzada' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'tresillos ni cambios 2↔3↔4' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: '6/8' })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
