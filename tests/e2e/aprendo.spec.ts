import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    // WebKit correctly refuses to retain Aprendo's production Secure cookie over
    // the deliberately HTTP-only local CI server. Bootstrap the same server-side
    // session through the real login endpoint, then install an HTTP-local copy of
    // that cookie only in the ephemeral browser context. Production cookie flags
    // remain untouched and are covered by the auth tests.
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
    await page.goto('/');
    await expect(page).toHaveURL(`${baseUrl}/`);
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

async function exposePracticeToolsIfCompact(page: Page): Promise<void> {
  const toggle = page.locator('[data-metronome-toggle]');
  if (await toggle.isVisible()) await toggle.click();
}

test('unauthenticated navigation redirects to login and a real login reaches the course', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login\/$/);

  await login(page, testInfo);
  await expect(page.getByRole('link', { name: 'Mi cuenta' })).toBeVisible();

  await page.goto('/bateria/unidad-1/');
  await expect(page).toHaveURL(/\/bateria\/unidad-1\/$/);
  await expect(page.getByRole('link', { name: /Sesión 0/i })).toBeVisible();
});

test('login keeps the #333333 background in light and dark color schemes', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/login/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(51, 51, 51)');
  }
});

test('invalid credentials expose an accessible authentication error', async ({ page }) => {
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill('missing-e2e-user');
  await page.getByLabel('Contraseña').fill('wrong-password');
  await page.getByLabel('Contraseña').press('Enter');

  await expect(page).toHaveURL(/\/login\/\?error=1$/);
  await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
});

test('metronome global keyboard shortcuts do not steal Space from focused controls', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');
  await exposePracticeToolsIfCompact(page);

  const play = page.getByRole('button', { name: 'Iniciar metrónomo' });
  const increase = page.getByRole('button', { name: 'Subir 1 BPM' });
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await increase.focus();
  await page.keyboard.press('Space');
  await expect(play).toHaveAttribute('aria-pressed', 'false');
});

test('compact trigger accurately exposes the complete practice tools panel', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');

  const compact = await page.evaluate(() => window.matchMedia('(max-width: 56rem)').matches);
  test.skip(!compact, 'compact viewport only');

  const toggle = page.locator('[data-metronome-toggle]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-label', 'Mostrar herramientas de práctica');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Ocultar herramientas de práctica');

  const panel = page.getByRole('complementary', { name: 'Herramientas de práctica' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Metrónomo' })).toBeVisible();
  await expect(panel.getByText('Autoescucha breve')).toBeVisible();
  await expect(panel.getByRole('link', { name: /Progreso y evidencia/ })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-label', 'Mostrar herramientas de práctica');
});

test('core authenticated pages do not create horizontal overflow at the project viewport', async ({ page }, testInfo) => {
  await login(page, testInfo);

  for (const path of ['/', '/bateria/unidad-1/', '/bateria/unidad-1/sesion-0-diagnostico/']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test('YouTube lesson links open in the general large video modal and close from X or backdrop', async ({ page }, testInfo) => {
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>stub video</title>',
  }));

  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/leccion-1-rebote-pulso-rolls/');

  const trigger = page.getByRole('link', { name: 'Drumeo — Single Stroke Roll' });
  const dialog = page.locator('[data-video-modal]');
  const frame = page.locator('[data-video-modal-frame]');

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/ynIV2P_trYQ?autoplay=1&rel=0');

  const size = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      widthRatio: rect.width / window.innerWidth,
      heightRatio: rect.height / window.innerHeight,
    };
  });
  expect(size.widthRatio).toBeGreaterThanOrEqual(0.88);
  expect(size.widthRatio).toBeLessThanOrEqual(0.94);
  expect(size.heightRatio).toBeGreaterThanOrEqual(0.85);
  expect(size.heightRatio).toBeLessThanOrEqual(0.92);

  await page.getByRole('button', { name: 'Cerrar vídeo' }).click();
  await expect(dialog).toBeHidden();
  await expect(frame).toHaveAttribute('src', 'about:blank');
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialog).toBeHidden();
  await expect(frame).toHaveAttribute('src', 'about:blank');
});
