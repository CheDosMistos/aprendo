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

test('unit cards use two columns and one contextual action through pending, active and complete states', async ({ page }, testInfo) => {
  await login(page, testInfo);

  let completedIds: string[] = [];
  await page.route(/\/api\/progress\/bateria\/\?limit=1$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: { completedContentIds: completedIds, needsReviewContentIds: [] } }),
    });
  });

  await page.goto('/bateria/');
  const card = page.locator('[data-unit-card]').filter({ hasText: 'Fase 1 · Unidad 2' });
  await expect(card).toHaveCount(1);
  await expect(card.getByText('Secciones', { exact: true })).toHaveCount(0);
  await expect(card.locator('[data-section-state]')).toHaveCount(0);

  const rows = card.locator('[data-content-id]');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0).locator('.section-kind')).toHaveText('Lección 1');
  await expect(rows.nth(1).locator('.section-kind')).toHaveText('Lección 2');
  await expect(rows.nth(4).locator('.section-kind')).toHaveText('Cierre');
  await expect(rows.nth(0).locator('.section-title')).toHaveText('Singles agrupados y subdivisión');
  await expect(rows.nth(0).locator('.section-title')).not.toContainText('Lección 1');
  await expect(rows.nth(4).locator('.section-title')).not.toContainText('Cierre');

  const firstGrid = await rows.nth(0).locator('a').evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(firstGrid.trim().split(/\s+/)).toHaveLength(2);

  const action = card.locator('[data-unit-action]');
  await expect(action).toHaveCount(1);
  await expect(action).toHaveText('Empezar unidad');
  await expect(action).toHaveAttribute('href', await rows.nth(0).locator('a').getAttribute('href') ?? '');

  const ids = await rows.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-content-id') ?? ''));
  completedIds = [ids[0]];
  await page.reload();

  const activeCard = page.locator('[data-unit-card]').filter({ hasText: 'Fase 1 · Unidad 2' });
  const activeRows = activeCard.locator('[data-content-id]');
  const activeAction = activeCard.locator('[data-unit-action]');
  await expect(activeAction).toHaveText('Continuar unidad');
  await expect(activeAction).toHaveAttribute('href', await activeRows.nth(1).locator('a').getAttribute('href') ?? '');

  completedIds = ids;
  await page.reload();

  const completeCard = page.locator('[data-unit-card]').filter({ hasText: 'Fase 1 · Unidad 2' });
  const completeAction = completeCard.locator('[data-unit-action]');
  await expect(completeAction).toHaveText('Ver unidad');
  await expect(completeAction).toHaveAttribute('href', '/bateria/unidad-2/');
});

test('phase tabs expose one phase at a time and compact cards remain usable on a narrow viewport', async ({ page }, testInfo) => {
  await login(page, testInfo);

  await page.route(/\/api\/progress\/bateria\/\?limit=1$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: { completedContentIds: [], needsReviewContentIds: [] } }),
    });
  });

  await page.goto('/bateria/');

  await expect(page.locator('.phase-group__head')).toHaveCount(0);

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(7);

  const phase1 = page.getByRole('tab', { name: 'Fase 1', exact: true });
  const phase2 = page.getByRole('tab', { name: 'Fase 2', exact: true });
  const phase3 = page.getByRole('tab', { name: 'Fase 3', exact: true });
  const phase7 = page.getByRole('tab', { name: /Fase 7/ });

  await expect(phase1).toHaveAttribute('aria-selected', 'true');
  await expect(phase7).toBeDisabled();
  await expect(page.locator('#fase-1-panel')).toBeVisible();
  await expect(page.locator('#fase-2-panel')).toBeHidden();
  await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1);

  await phase2.click();
  await expect(phase2).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#fase-1-panel')).toBeHidden();
  await expect(page.locator('#fase-2-panel')).toBeVisible();
  await expect(page).toHaveURL(/#fase-2$/);

  await phase2.press('ArrowRight');
  await expect(phase3).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#fase-3-panel')).toBeVisible();
  await expect(page).toHaveURL(/#fase-3$/);

  await page.setViewportSize({ width: 390, height: 844 });
  const tabList = page.locator('[data-phase-tabs]');
  const horizontalOverflow = await tabList.evaluate((element) => element.scrollWidth > element.clientWidth);
  expect(horizontalOverflow).toBe(true);

  const unitGridColumns = await page.locator('#fase-3-panel .unit-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(unitGridColumns.trim().split(/\s+/)).toHaveLength(1);

  const mobileCard = page.locator('#fase-3-panel [data-unit-card]').first();
  const mobileHeadingSize = Number.parseFloat(await mobileCard.locator('h3').evaluate((element) => getComputedStyle(element).fontSize));
  expect(mobileHeadingSize).toBeGreaterThanOrEqual(21);

  const mobileActionBox = await mobileCard.locator('[data-unit-action]').boundingBox();
  expect(mobileActionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1);
});
