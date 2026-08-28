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

async function expectProtected(score: ReturnType<Page['locator']>): Promise<void> {
  await expect(score).toBeVisible();
  await expect(score).toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'true');
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Empezar' })).toBeVisible();
}

async function completeFirstAttempt(score: ReturnType<Page['locator']>): Promise<void> {
  await score.getByRole('button', { name: 'Empezar' }).click();
  await expect(score).toHaveAttribute('data-first-sight-started', 'true');
  await expect(score.locator('.course-score__shell')).toHaveAttribute('aria-hidden', 'false');
  await expect(score.locator('.course-score__play')).toBeHidden();
  await score.getByRole('button', { name: 'Finalizar intento' }).click();
  await expect(score).toHaveAttribute('data-first-sight-completed', 'true');
  await expect(score.locator('.course-score__play')).toBeVisible();
}

test('Phase 2 U9 overview defines one-use first sight and separates continuity from precision', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-9/');
  await expect(page.getByRole('heading', { level: 1, name: 'Primera vista I: continuidad y recuperación' })).toBeVisible();
  await expect(page.getByText('PRIMERA VISTA = MATERIAL REALMENTE NUEVO + INSPECCIÓN BREVE + PRIMER INTENTO SIN ENSAYO NI PLAYBACK PREVIO.', { exact: true })).toBeVisible();
  await expect(page.getByText('ESA MISMA PARTITURA → PRÁCTICA DE LECTURA, NO NUEVA EVIDENCIA D5.', { exact: true })).toBeVisible();
  await expect(page.getByText('continuidad / recuperación', { exact: true })).toBeVisible();
  await expect(page.getByText('precisión de lectura / ejecución', { exact: true })).toBeVisible();
  await expect(page.locator('.course-score')).toHaveCount(0);
});

test('Phase 2 U9 lessons publish four distinct protected first-sight samples and keep playback locked through the first attempt', async ({ page }, testInfo) => {
  await login(page, testInfo);
  const lessons = [
    ['/bateria/fase-2-unidad-9/protocolo-un-solo-intento/', 'Primera vista: protocolo de un solo intento', 'MusicXML — fuente de la muestra protegida L1'],
    ['/bateria/fase-2-unidad-9/continuidad-y-precision/', 'Continuidad y precisión: medirlas por separado', 'MusicXML — fuente de la muestra protegida L2'],
    ['/bateria/fase-2-unidad-9/recuperacion-sin-reiniciar/', 'Recuperación: error local sin reiniciar', 'MusicXML — fuente de la muestra protegida L3'],
    ['/bateria/fase-2-unidad-9/transferencia-compas-compuesto/', 'Transferencia: primera vista en compás compuesto conocido', 'MusicXML — fuente de la muestra protegida L4'],
  ] as const;

  for (const [route, heading, sourceLabel] of lessons) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const score = page.locator('.course-score[data-score-first-sight="true"]');
    await expect(score).toHaveCount(1);
    await expectProtected(score);
    await expect(score.getByRole('link', { name: sourceLabel })).toBeVisible();
  }

  await page.goto(lessons[0][0]);
  await completeFirstAttempt(page.locator('.course-score[data-score-first-sight="true"]'));
});

test('Phase 2 U9 checkpoint exposes two independent protected samples and both unlock playback only after completion', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-9/puerta-primera-vista-i/');
  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de primera vista I' })).toBeVisible();
  await expect(page.getByText('UNA SOLA LÍNEA NO DEBE DECIDIR D5. DOS MUESTRAS TAMPOCO CONVIERTEN AUTOMÁTICAMENTE D5 EN FUNCIONAL.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Muestra A — 4/4' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Muestra B — 6/8' })).toBeVisible();

  const scores = page.locator('.course-score[data-score-first-sight="true"]');
  await expect(scores).toHaveCount(2);
  await expectProtected(scores.nth(0));
  await expectProtected(scores.nth(1));
  await completeFirstAttempt(scores.nth(0));
  await expect(scores.nth(1).locator('.course-score__play')).toBeHidden();
  await completeFirstAttempt(scores.nth(1));

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA ABRIR U10' })).toBeVisible();
  await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
});
