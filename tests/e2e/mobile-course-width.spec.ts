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

test('mobile course article uses the full available content width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile regression');
  await login(page, testInfo);
  await page.goto('/bateria/unidad-1/leccion-1-rebote-pulso-rolls/');

  const dimensions = await page.evaluate(() => {
    const layout = document.querySelector<HTMLElement>('.learning-layout');
    const main = document.querySelector<HTMLElement>('.learning-main');
    const article = document.querySelector<HTMLElement>('.course-article');
    if (!layout || !main || !article) throw new Error('Course layout missing');

    const layoutRect = layout.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const articleRect = article.getBoundingClientRect();
    return {
      layoutWidth: layoutRect.width,
      mainWidth: mainRect.width,
      articleWidth: articleRect.width,
      articleRightGap: layoutRect.right - articleRect.right,
      gridTemplateColumns: getComputedStyle(layout).gridTemplateColumns,
    };
  });

  expect(dimensions.mainWidth / dimensions.layoutWidth).toBeGreaterThan(0.98);
  expect(dimensions.articleWidth / dimensions.layoutWidth).toBeGreaterThan(0.98);
  expect(Math.abs(dimensions.articleRightGap)).toBeLessThan(2);
  expect(dimensions.gridTemplateColumns.trim().split(/\s+/)).toHaveLength(1);
});
