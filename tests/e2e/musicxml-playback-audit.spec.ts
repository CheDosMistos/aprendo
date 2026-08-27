import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(/\/$/);
}

test('a MusicXML inserted after initial page load still gets the complete player and Play button', async ({ page }) => {
  await login(page);
  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');

  await page.evaluate(() => {
    const lateScore = document.createElement('div');
    lateScore.id = 'late-musicxml-regression';
    lateScore.dataset.notationScore = '';
    lateScore.dataset.scoreSrc = '/bateria/notation/rudiments/04-multiple-bounce-roll.musicxml';
    lateScore.dataset.scoreTitle = 'Partitura insertada después de cargar la lección';
    lateScore.dataset.scoreBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
    lateScore.dataset.scoreSourceUrl = '/bateria/notation/rudiments/04-multiple-bounce-roll.musicxml';
    lateScore.dataset.scoreSourceLabel = 'Abrir fuente MusicXML';
    (document.querySelector('main') ?? document.body).append(lateScore);
    window.dispatchEvent(new CustomEvent('aprendo:notation-scores-updated'));
  });

  const lateScore = page.locator('#late-musicxml-regression');
  await expect(lateScore).toHaveClass(/course-score/);
  await expect(lateScore).toHaveAttribute('data-notation-enhanced', 'true');
  await expect(lateScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(lateScore.locator('.course-score__play')).toBeVisible();
  await expect(lateScore.locator('.course-score__play')).toBeEnabled({ timeout: 15_000 });
});

test('a late MusicXML is also enhanced through DOM observation without relying on the custom event', async ({ page }) => {
  await login(page);
  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');

  await page.evaluate(() => {
    const lateScore = document.createElement('div');
    lateScore.id = 'late-musicxml-observer-regression';
    lateScore.dataset.notationScore = '';
    lateScore.dataset.scoreSrc = '/bateria/notation/u1/preparacion-alternancia-pulso.musicxml';
    lateScore.dataset.scoreTitle = 'Partitura heredada insertada dinámicamente';
    lateScore.dataset.scoreBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
    (document.querySelector('main') ?? document.body).append(lateScore);
  });

  const lateScore = page.locator('#late-musicxml-observer-regression');
  await expect(lateScore).toHaveClass(/course-score/);
  await expect(lateScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(lateScore.locator('.course-score__play')).toBeEnabled({ timeout: 15_000 });
});
