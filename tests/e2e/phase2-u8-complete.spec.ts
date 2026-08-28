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

async function expectLoadedFeedbackScore(page: Page, sourceLabel: string, href: string): Promise<void> {
  const scores = page.locator('.course-score');
  await expect(scores).toHaveCount(1);
  const score = scores.first();
  await expect(score).toHaveAttribute('data-score-feedback', 'after-attempt');
  await expect(score).not.toHaveAttribute('data-score-first-sight', 'true');
  await expect(score.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(score.locator('.course-score__play')).toBeHidden();
  await expect(score.getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  await expect(score.getByRole('link', { name: sourceLabel })).toHaveAttribute('href', href);
}

test('Phase 2 U8 overview exposes the notation-first architecture and keeps D5/U10 outside the unit', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-8/');

  await expect(page.getByRole('heading', { level: 1, name: 'Sextillos, rolls y ornamentaciones escritas' })).toBeVisible();
  await expect(page.getByText('VER EL SÍMBOLO → DECODIFICAR SU FUNCIÓN → EJECUTAR → RECONOCER/APLICAR LA FAMILIA.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Arquitectura de U8' })).toBeVisible();
  await expect(page.getByText('L1 — Sextillo escrito: seis en el tiempo de cuatro', { exact: true })).toBeVisible();
  await expect(page.getByText('L2 — Flam escrito: grace note y principal', { exact: true })).toBeVisible();
  await expect(page.getByText('L3 — Drag escrito: double grace y principal', { exact: true })).toBeVisible();
  await expect(page.getByText('L4 — Rolls escritos: duración y repetición indicada', { exact: true })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'D5 primera vista formal' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'click reducido, half-time o gaps' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'PAS — PDF oficial de los 40 rudimentos' })).toHaveAttribute('href', 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf');
  await expect(page.locator('.course-score')).toHaveCount(0);
});

test('Phase 2 U8 lessons render the four notation families with feedback-gated original MusicXML', async ({ page }, testInfo) => {
  await login(page, testInfo);

  const lessons = [
    {
      route: '/bateria/fase-2-unidad-8/sextillo-escrito-seis-en-tiempo-de-cuatro/',
      heading: 'Sextillo escrito: seis en el tiempo de cuatro',
      marker: 'SEXTILLO 6:4 = TUPLET. NO ES 6/8, 9/8 NI 12/8.',
      sourceLabel: 'MusicXML — fuente del ejercicio 4↔6',
      href: '/bateria/notation/f2/u8/f2-u8-l1-semicorcheas-vs-sextillos-6-4.musicxml',
    },
    {
      route: '/bateria/fase-2-unidad-8/flam-escrito-grace-note-y-principal/',
      heading: 'Flam escrito: grace note y principal',
      marker: 'PRIMERO IDENTIFICA GRACE NOTE + PRINCIPAL. DESPUÉS APLICA LA MECÁNICA DE TIPO FLAM.',
      sourceLabel: 'MusicXML — fuente del ejercicio grace→principal',
      href: '/bateria/notation/f2/u8/f2-u8-l2-linea-base-vs-grace-note.musicxml',
    },
    {
      route: '/bateria/fase-2-unidad-8/drag-escrito-double-grace-y-principal/',
      heading: 'Drag escrito: double grace y principal',
      marker: 'DOUBLE GRACE + PRINCIPAL ≠ TRES NOTAS ORDINARIAS IGUALES.',
      sourceLabel: 'MusicXML — fuente del ejercicio double-grace→principal',
      href: '/bateria/notation/f2/u8/f2-u8-l3-linea-base-vs-double-grace.musicxml',
    },
    {
      route: '/bateria/fase-2-unidad-8/roll-escrito-duracion-y-repeticion/',
      heading: 'Roll escrito: duración y repetición indicada',
      marker: 'UNA MARCA DE ROLL/TREMOLO MODIFICA CÓMO SE REPITE UNA DURACIÓN; NO AÑADE POR SÍ SOLA NUEVOS PULSOS AL COMPÁS.',
      sourceLabel: 'MusicXML — fuente del ejercicio roll escrito',
      href: '/bateria/notation/f2/u8/f2-u8-l4-linea-base-vs-roll-escrito.musicxml',
    },
  ] as const;

  for (const lesson of lessons) {
    await page.goto(lesson.route);
    await expect(page.getByRole('heading', { level: 1, name: lesson.heading })).toBeVisible();
    await expect(page.getByText(lesson.marker, { exact: true })).toBeVisible();
    await expectLoadedFeedbackScore(page, lesson.sourceLabel, lesson.href);
    await expect(page.getByText('INFERENCIA → EVIDENCIA → TAREA → CONDICIONES → DECISIÓN', { exact: true })).toBeVisible();
  }
});

test('Phase 2 U8 checkpoint renders the exclusive four-function sample without pretending to be first sight', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-8/puerta-decodificacion-ornamental/');

  await expect(page.getByRole('heading', { level: 1, name: 'Puerta de decodificación ornamental' })).toBeVisible();
  await expect(page.getByText('¿PUEDES VER UN SÍMBOLO NUEVO EN UNA LÍNEA NUEVA, EXPLICAR QUÉ MODIFICA Y EJECUTARLO SIN NECESITAR QUE EL NOMBRE DEL RUDIMENTO ACTIVE LA RESPUESTA?', { exact: true })).toBeVisible();
  await expectLoadedFeedbackScore(page, 'MusicXML — fuente de la muestra ornamental del checkpoint', '/bateria/notation/f2/u8/f2-u8-checkpoint-decodificacion-ornamental.musicxml');

  await expect(page.getByRole('heading', { level: 3, name: 'Compás 1 — sextillo selectivo' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Compás 2 — grace simple selectiva' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Compás 3 — double grace selectiva' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Compás 4 — roll escrito con salida' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA ABRIR U9' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'primera vista formal D5' })).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'click reducido, half-time o gaps' })).toBeVisible();

  const score = page.locator('.course-score').first();
  await score.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(score).toHaveAttribute('data-feedback-locked', 'false');
  await expect(score.locator('.course-score__play')).toBeVisible();
});
