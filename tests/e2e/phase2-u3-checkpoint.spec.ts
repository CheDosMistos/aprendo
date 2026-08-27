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

test('Phase 2 U3 checkpoint protects the exclusive new score and hides auditory answers', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/puerta-de-duracion-y-sincopa-i/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de duración y síncopa I' })).toBeVisible();
  await expect(page.getByText('¿D2/F1–F2 y C1/C2 están suficientemente disponibles para abrir U4', { exact: false })).toBeVisible();

  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);

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
  await expect(firstSight.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u3/f2-u3-checkpoint-a.musicxml');

  const dictations = page.locator('.rhythm-dictation');
  await expect(dictations).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    await expect(dictations.nth(index).locator('[data-dictation-status]')).toHaveText('4 pulsos de entrada y después 1 pulso. Escribe antes de revelar.');
    await expect(dictations.nth(index).locator('[data-dictation-answer-text]')).toBeHidden();
  }

  await dictations.first().getByRole('button', { name: 'Mostrar respuesta' }).click();
  await expect(dictations.first().locator('[data-dictation-answer-text]')).toBeVisible();
  await expect(dictations.first().locator('[data-dictation-answer-text]')).toContainText('no determina por sí solo si la notación usa ligadura o silencio');
});

test('Phase 2 U3 checkpoint keeps the decision multidimensional and opens only U4 novelty', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/puerta-de-duracion-y-sincopa-i/');

  await expect(page.locator('h2').filter({ hasText: '3. Explicación conceptual' })).toBeVisible();
  await expect(page.getByText('Un ataque empieza en & de 2 y una ligadura prolonga su duración a través de 3', { exact: false })).toBeVisible();

  for (const decision of ['CONTINUAR', 'CONTINUAR + CORRECTIVO', 'REDUCIR NOVEDAD', 'DETENER CARGA']) {
    await expect(page.getByRole('heading', { level: 3, name: decision, exact: true })).toBeVisible();
  }

  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR A U4' })).toBeVisible();
  for (const criterion of ['cero errores;', 'BPM fijo o alto;', 'síncopa variada;', 'acentos complejos;', 'B7 funcional;', 'primera vista avanzada.']) {
    await expect(page.locator('li').filter({ hasText: new RegExp(`^${criterion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })).toBeVisible();
  }

  await expect(page.getByText('Completar este checkpoint', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente D2, F1, F2, C1, C2, E4', { exact: false })).toBeVisible();
  await expect(page.getByText('20.U4 — Síncopa II, acentos y lectura aplicada', { exact: false })).toBeVisible();
  await expect(page.getByText('La línea rítmica seguirá mandando; el rudimento servirá a la lectura', { exact: false })).toBeVisible();
});

test('Phase 2 U3 overview marks editorial completion without turning page completion into competence', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-3/fase-2-unidad-3-introduccion/');

  await expect(page.getByText('El recorrido editorial de U3 queda completo', { exact: false })).toBeVisible();
  await expect(page.getByText('no significa que un alumno haya “aprobado U3”', { exact: false })).toBeVisible();
});
