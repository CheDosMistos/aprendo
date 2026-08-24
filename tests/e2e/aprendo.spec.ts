import { expect, test, type Page } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';

async function login(page: Page): Promise<void> {
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(/\/$/);
}

test('unauthenticated navigation redirects to login and a real login reaches the course', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login\/$/);

  await login(page);
  await expect(page.getByRole('link', { name: 'Mi cuenta' })).toBeVisible();

  await page.goto('/bateria/unidad-1/');
  await expect(page).toHaveURL(/\/bateria\/unidad-1\/$/);
  await expect(page.getByRole('link', { name: /Sesión 0/i })).toBeVisible();
});

test('invalid credentials expose an accessible authentication error', async ({ page }) => {
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill('missing-e2e-user');
  await page.getByLabel('Contraseña').fill('wrong-password');
  await page.getByLabel('Contraseña').press('Enter');

  await expect(page).toHaveURL(/\/login\/\?error=1$/);
  await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
});

test('metronome global keyboard shortcuts do not steal Space from focused controls', async ({ page }) => {
  await login(page);
  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');

  const play = page.getByRole('button', { name: 'Iniciar metrónomo' });
  const increase = page.getByRole('button', { name: 'Subir 1 BPM' });
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await increase.focus();
  await page.keyboard.press('Space');
  await expect(play).toHaveAttribute('aria-pressed', 'false');
});

test('core authenticated pages do not create horizontal overflow at the project viewport', async ({ page }) => {
  await login(page);

  for (const path of ['/', '/bateria/unidad-1/', '/bateria/unidad-1/sesion-0-diagnostico/']) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});
