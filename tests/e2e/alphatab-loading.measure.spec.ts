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

async function resources(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  return page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry as PerformanceResourceTiming)
    .filter((entry) => entry.initiatorType === 'script' || /\.(?:js|mjs)(?:\?|$)/.test(entry.name))
    .map((entry) => ({
      name: new URL(entry.name).pathname,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
    })));
}

test('PERF-001 measure JavaScript loaded with and without notation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single-browser measurement');
  await login(page);

  const withoutNotation = await resources(page, '/bateria/unidad-1/');
  const withNotation = await resources(page, '/bateria/unidad-1/sesion-0-diagnostico/');

  console.log('PERF_MEASURE_NO_NOTATION', JSON.stringify(withoutNotation));
  console.log('PERF_MEASURE_WITH_NOTATION', JSON.stringify(withNotation));

  await page.goto('/bateria/unidad-1/');
  await expect(page.locator('[data-notation-score]')).toHaveCount(0);
  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');
  await expect(page.locator('[data-notation-score]')).toHaveCount(1);
});
