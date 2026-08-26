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
    await page.goto('/');
    return;
  }

  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

function secondsFromClock(value: string): number {
  const [minutes, seconds] = value.split(':').map(Number);
  return (minutes ?? 0) * 60 + (seconds ?? 0);
}

test('section duration badges drive a compact timer and the metronome', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/leccion-1-rebote-pulso-rolls/');

  const preparationBadge = page.getByRole('button', { name: 'Temporizador de 3min para Preparación' });
  const singleStrokeBadge = page.getByRole('button', { name: 'Temporizador de 6min para Single Stroke Roll' });
  const timer = page.locator('[data-practice-timer]');
  const timerToggle = page.locator('[data-practice-timer-toggle]');
  const timerClock = page.locator('[data-practice-timer-time]');
  const timerState = page.locator('[data-practice-timer-state]');
  const metronomePlay = page.locator('[data-metronome] [data-play]');
  const tools = page.locator('#course-metronome-panel');

  await expect(preparationBadge).toBeVisible();
  await expect(singleStrokeBadge).toBeVisible();
  await expect(page.locator('.course-article h2').first()).not.toContainText('unos 3 minutos');
  await expect(preparationBadge).toHaveText('3min');
  await expect(singleStrokeBadge).toHaveText('6min');
  await expect(timer).toBeHidden();

  await preparationBadge.click();
  await expect(timer).toBeVisible();
  await expect(preparationBadge).toHaveAttribute('aria-pressed', 'true');
  await expect(metronomePlay).toHaveAttribute('aria-pressed', 'true');
  await expect(timerState).toHaveText('En curso');

  const compact = await page.evaluate(() => window.matchMedia('(max-width: 56rem)').matches);
  if (compact) {
    await expect(tools).toBeVisible();
    await expect(page.locator('[data-metronome-toggle]')).toHaveAttribute('aria-expanded', 'true');
  }

  const initialSeconds = secondsFromClock(await timerClock.innerText());
  expect(initialSeconds).toBeGreaterThanOrEqual(175);
  expect(initialSeconds).toBeLessThanOrEqual(180);

  await timerToggle.click();
  await expect(timerState).toHaveText('Pausa');
  await expect(metronomePlay).toHaveAttribute('aria-pressed', 'false');
  const pausedClock = await timerClock.innerText();
  await page.waitForTimeout(450);
  await expect(timerClock).toHaveText(pausedClock);

  await timerToggle.click();
  await expect(timerState).toHaveText('En curso');
  await expect(metronomePlay).toHaveAttribute('aria-pressed', 'true');

  if (compact) {
    await page.locator('[data-metronome-backdrop]').click({ position: { x: 5, y: 5 } });
    await expect(tools).toBeHidden();
  }

  await preparationBadge.click();
  await expect(timer).toBeHidden();
  await expect(preparationBadge).toHaveAttribute('aria-pressed', 'false');
  await expect(metronomePlay).toHaveAttribute('aria-pressed', 'false');

  await singleStrokeBadge.click();
  await expect(timer).toBeVisible();
  await expect(singleStrokeBadge).toHaveAttribute('aria-pressed', 'true');
  const switchedSeconds = secondsFromClock(await timerClock.innerText());
  expect(switchedSeconds).toBeGreaterThanOrEqual(355);
  expect(switchedSeconds).toBeLessThanOrEqual(360);
  await expect(metronomePlay).toHaveAttribute('aria-pressed', 'true');
});

test('hiding a timer cancels a metronome start that is still awaiting AudioContext resume', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'race regression needs one deterministic browser');

  await page.addInitScript(() => {
    class DelayedAudioContext {
      state = 'suspended';
      currentTime = 0;

      async resume() {
        await new Promise((resolve) => setTimeout(resolve, 300));
        this.state = 'running';
      }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: DelayedAudioContext });
  });

  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/leccion-1-rebote-pulso-rolls/');

  const badge = page.getByRole('button', { name: 'Temporizador de 3min para Preparación' });
  const timer = page.locator('[data-practice-timer]');
  const metronomePlay = page.locator('[data-metronome] [data-play]');

  await badge.click();
  await expect(timer).toBeVisible();
  await badge.click();
  await expect(timer).toBeHidden();
  await page.waitForTimeout(450);
  await expect(metronomePlay).toHaveAttribute('aria-pressed', 'false');
});
