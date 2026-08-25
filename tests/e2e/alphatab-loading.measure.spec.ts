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

async function scriptResources(page: import('@playwright/test').Page) {
  return page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry as PerformanceResourceTiming)
    .filter((entry) => entry.initiatorType === 'script' || /\.(?:js|mjs)(?:\?|$)/.test(entry.name))
    .map((entry) => ({
      name: new URL(entry.name).pathname,
      encodedBodySize: entry.encodedBodySize,
    })));
}

const alphaTabBytes = (resources: Awaited<ReturnType<typeof scriptResources>>) => resources
  .filter((resource) => /alphatab/i.test(resource.name))
  .reduce((sum, resource) => sum + resource.encodedBodySize, 0);

test('PERF-001 loads the alphaTab engine only on pages that contain notation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single-browser loading regression');
  await login(page);

  await page.goto('/bateria/unidad-1/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-notation-score]')).toHaveCount(0);
  const withoutNotation = await scriptResources(page);
  expect(alphaTabBytes(withoutNotation)).toBeLessThan(100_000);
  expect(withoutNotation.some((resource) => /alphatab\.worker/i.test(resource.name))).toBe(false);

  await page.goto('/bateria/unidad-1/sesion-0-diagnostico/');
  await expect(page.locator('[data-notation-score]')).toHaveCount(1);
  await expect(page.locator('.course-score__status')).toHaveText('Partitura renderizada', { timeout: 15_000 });
  const withNotation = await scriptResources(page);
  expect(alphaTabBytes(withNotation)).toBeGreaterThan(500_000);
});
