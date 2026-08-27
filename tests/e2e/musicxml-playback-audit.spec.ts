import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';
const lessonUrl = '/bateria/fase-2-unidad-1/fluidez-binaria-sin-memorizar-dibujos/';

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

async function openNotationLesson(page: Page): Promise<void> {
  await page.goto(lessonUrl);
  await expect(page.getByRole('heading', { level: 1, name: 'Fluidez binaria sin memorizar dibujos' })).toBeVisible();
  const existing = page.locator('.course-score').last();
  await expect(existing).toBeVisible({ timeout: 15_000 });
  await expect(existing.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
}

test('a MusicXML inserted after initial page load still gets the complete player and Play button', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await openNotationLesson(page);

  await page.evaluate(() => {
    const lateScore = document.createElement('div');
    lateScore.id = 'late-musicxml-regression';
    lateScore.dataset.notationScore = '';
    lateScore.dataset.scoreSrc = '/bateria/notation/rudiments/04-multiple-bounce-roll.musicxml';
    lateScore.dataset.scoreTitle = 'Partitura insertada después de cargar la lección';
    lateScore.dataset.scoreBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
    lateScore.dataset.scoreSourceUrl = '/bateria/notation/rudiments/04-multiple-bounce-roll.musicxml';
    lateScore.dataset.scoreSourceLabel = 'Abrir fuente MusicXML';
    document.querySelector('.course-article')?.append(lateScore);
    window.dispatchEvent(new CustomEvent('aprendo:notation-scores-updated'));
  });

  const lateScore = page.locator('#late-musicxml-regression');
  await expect(lateScore).toHaveClass(/course-score/, { timeout: 15_000 });
  await expect(lateScore).toHaveAttribute('data-notation-enhanced', 'true');
  await expect(lateScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(lateScore.locator('.course-score__play')).toBeVisible();
  await expect(lateScore.locator('.course-score__play')).toBeEnabled({ timeout: 15_000 });
});

test('a late MusicXML is also enhanced through DOM observation without relying on the custom event', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await openNotationLesson(page);

  await page.evaluate(() => {
    const lateScore = document.createElement('div');
    lateScore.id = 'late-musicxml-observer-regression';
    lateScore.dataset.notationScore = '';
    lateScore.dataset.scoreSrc = '/bateria/notation/u1/preparacion-alternancia-pulso.musicxml';
    lateScore.dataset.scoreTitle = 'Partitura heredada insertada dinámicamente';
    lateScore.dataset.scoreBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
    document.querySelector('.course-article')?.append(lateScore);
  });

  const lateScore = page.locator('#late-musicxml-observer-regression');
  await expect(lateScore).toHaveClass(/course-score/, { timeout: 15_000 });
  await expect(lateScore.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  await expect(lateScore.locator('.course-score__play')).toBeEnabled({ timeout: 15_000 });
});
