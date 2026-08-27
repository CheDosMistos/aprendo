import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';
const pasUrl = 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf';

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

test('Phase 2 U4 L3 renders PAS as normative reference and the course application as separate original notation', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/la-linea-manda-aplicacion-b7/');

  await expect(page.getByRole('heading', { level: 1, name: 'La línea manda: aplicación B7 sobre lectura conocida' })).toBeVisible();
  await expect(page.getByText('LA LÍNEA RÍTMICA MANDA; EL RUDIMENTO SIRVE A LA LECTURA, NO AL REVÉS', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'PAS — International Drum Rudiments (PDF oficial)' })).toHaveAttribute('href', pasUrl);

  const pasStudy = page.locator('[data-score-rudiment="Single Paradiddle"]');
  await expect(pasStudy).toHaveCount(1);
  await expect(pasStudy).toHaveAttribute('data-score-src', '/bateria/notation/rudiments/16-single-paradiddle.musicxml');
  await expect(pasStudy).toHaveAttribute('data-score-source-url', pasUrl);
  await expect(pasStudy).toHaveAttribute('data-score-source-label', 'Referencia normativa PAS');

  const staticScores = page.locator('.course-score[data-score-feedback="after-attempt"]');
  await expect(staticScores).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    await expect(staticScores.nth(index).locator('.course-score__play')).toBeHidden();
    await expect(staticScores.nth(index).getByRole('button', { name: 'Habilitar audio' })).toBeVisible();
  }

  const textureScore = page.locator('.course-score').filter({
    has: page.locator('a[href="/bateria/notation/f2/u4/f2-u4-l3-textura-manos.musicxml"]'),
  });
  await expect(textureScore).toHaveCount(1);
  await expect(textureScore.getByRole('link', { name: 'MusicXML — fuente del ejercicio' })).toHaveAttribute('href', '/bateria/notation/f2/u4/f2-u4-l3-textura-manos.musicxml');
  await textureScore.getByRole('button', { name: 'Habilitar audio' }).click();
  await expect(textureScore.locator('.course-score__play')).toBeVisible();
});

test('Phase 2 U4 L3 keeps decoding before texture and does not claim the U4 line is PAS notation', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/fase-2-unidad-4/la-linea-manda-aplicacion-b7/');

  await expect(page.getByText('DECODIFICAR LÍNEA → TOCAR LÍNEA BASE → ELEGIR TEXTURA → APLICAR → COMPARAR', { exact: false })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '2. Decodificar y tocar la línea base' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: '3. Elegir textura y aplicar' })).toBeVisible();
  await expect(page.getByText('no presentamos esta línea como la partitura PAS #16', { exact: false })).toBeVisible();
  await expect(page.getByText('no afirmamos que tocar esta línea equivalga a ejecutar el Single Paradiddle normativo', { exact: false })).toBeVisible();
  await expect(page.getByText('Una continuación ligada no recibe una nueva letra de mano', { exact: false })).toBeVisible();
  await expect(page.getByText('Volver al sticking simple no es un fracaso de B7', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'MÍNIMO PARA AVANZAR' })).toBeVisible();
  await expect(page.getByText('No se exige cero errores, un BPM concreto', { exact: false })).toBeVisible();
  await expect(page.getByText('no actualiza automáticamente B7', { exact: false })).toBeVisible();
  await expect(page.getByText('leer, seguir y recuperarse', { exact: true })).toBeVisible();
  await expect(page.getByText('primera vista como competencia central seguirá reservada para U9', { exact: false })).toBeVisible();
  await expect(page.locator('.rhythm-dictation')).toHaveCount(0);
});
