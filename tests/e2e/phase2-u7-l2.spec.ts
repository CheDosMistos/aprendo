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

test('Phase 2 U7 L2 renders real 12/8 with feedback-gated playback', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/12-8-cuatro-pulsos-compuestos/');

  await expect(page.getByRole('heading', { level: 1, name: '12/8: cuatro pulsos compuestos' })).toBeVisible();
  await expect(page.getByText('12/8 PROTOTÍPICO = 4 PULSOS PRINCIPALES × 3 SUBDIVISIONES.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u7/f2-u7-l2-12-8-cuatro-pulsos-compuestos.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U7 L2 preserves four compound beats and leaves systematic contrast to L3', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/12-8-cuatro-pulsos-compuestos/');

  await expect(page.getByText('COMPÁS 12/8 → 4 PULSOS PRINCIPALES → 3 CORCHEAS POR PULSO', { exact: true })).toBeVisible();
  await expect(page.getByText('6/8 = 2×3 → 9/8 = 3×3 → 12/8 = 4×3', { exact: true })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'dominar el contraste simple/compuesto antes de L3' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'reconocimiento auditivo E5 general' })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});

test('Phase 2 U7 L2 exposes pulse-unit conditions and continuity criteria', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-7/12-8-cuatro-pulsos-compuestos/');

  await expect(page.locator('h2').filter({ hasText: '4. Continuidad a través de cuatro pulsos' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '5. Metrónomo y unidad de pulso' })).toBeVisible();
  await expect(page.locator('code').filter({ hasText: '♩. = 60' }).first()).toBeVisible();
  await expect(page.getByText('Significa 60 pulsos principales por minuto y tres corcheas internas por pulso.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L3' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'un BPM fijo o alto' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'click reducido o gaps de U10' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
