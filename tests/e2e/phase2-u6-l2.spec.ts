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

test('Phase 2 U6 L2 renders its 6/8 attack-rest study and gates playback until self-attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/ataques-y-silencios-dentro-de-6-8/');

  await expect(page.getByRole('heading', { level: 1, name: 'Ataques y silencios dentro de 6/8' })).toBeVisible();
  await expect(page.getByText('UN SILENCIO OCUPA TIEMPO. NO BORRA EL PULSO NI LA POSICIÓN QUE OCUPA.', { exact: true })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u6/f2-u6-l2-ataques-silencios.musicxml');

  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
  await expect(score.locator('.course-score__play')).toBeEnabled();
});

test('Phase 2 U6 L2 keeps silent positions inside the two-beat compound hierarchy', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/ataques-y-silencios-dentro-de-6-8/');

  await expect(page.locator('h2').filter({ hasText: '2. Qué debe continuar durante un silencio' })).toBeVisible();
  await expect(page.getByText('X X · | · X X', { exact: true })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'El 2 sigue existiendo aunque la primera corchea de ese segundo pulso sea silencio.' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '4. Continuidad a través del silencio' })).toBeVisible();
  await expect(page.getByText('continuidad', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});

test('Phase 2 U6 L2 diagnoses attack, subdivision and compound-pulse failures separately without advancing L3 content', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-6/ataques-y-silencios-dentro-de-6-8/');

  await expect(page.locator('h2').filter({ hasText: '5. Diagnóstico: ¿qué se perdió?' })).toBeVisible();
  for (const diagnosis of ['Error de ataque', 'Error de subdivisión', 'Pérdida del pulso compuesto', 'Error de representación']) {
    await expect(page.getByRole('heading', { level: 3, name: diagnosis, exact: true })).toBeVisible();
  }

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A L3' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'un BPM fijo o alto' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'comparación funcional 3/4 ↔ 6/8 — L3' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5 — U9' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'actualizar automáticamente C1, C2, D4 o F2' })).toBeVisible();
  await expect(page.getByText('agrupación/variación interna dentro del mismo compás', { exact: false })).toBeVisible();
});
