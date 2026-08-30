import { expect, test, type Page, type TestInfo } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'e2e-admin';
const password = process.env.E2E_PASSWORD ?? 'ci-e2e-password-2026';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4323';

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.name === 'webkit-tablet') {
    const response = await page.request.post(`${baseUrl}/api/auth/login/`, { form: { username, password }, headers: { Origin: baseUrl }, maxRedirects: 0 });
    expect(response.status()).toBe(303);
    const match = /(?:^|,\s*)aprendo_session=([^;]+)/i.exec(response.headers()['set-cookie'] ?? '');
    expect(match?.[1]).toBeTruthy();
    const url = new URL(baseUrl);
    await page.context().addCookies([{ name: 'aprendo_session', value: match![1], domain: url.hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Strict' }]);
    return;
  }
  await page.goto('/login/');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Contraseña').press('Enter');
  await expect(page).toHaveURL(`${baseUrl}/`);
}

test('U11 overview keeps theory useful, pad-compatible and below kit interpretation', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/');
  await expect(page.getByRole('heading', { level: 1, name: 'Repertorio, teoría tonal útil y relación bajo–batería' })).toBeVisible();
  const article = page.locator('article.course-article');
  await expect(article.getByText(/intervalo, escala, acorde y centro tonal al nivel útil para un batería/)).toBeVisible();
  await expect(article.getByText(/coincidencia y complemento entre bajo y batería/)).toBeVisible();
  await expect(article.getByText(/Tocar canciones completas en kit/)).toBeVisible();
});

test('U11 L1 requires a full listen before block help and keeps the map hidden until reveal', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/del-audio-al-mapa/');
  const widget = page.locator('.rhythm-form');
  await expect(widget).toHaveCount(1);
  await expect(widget.getByRole('button', { name: /A · 0/ })).toBeDisabled();
  await expect(widget.locator('[data-form-answer-text]')).toBeHidden();
  await widget.getByRole('button', { name: 'Escuchar fuente completa' }).click();
  await expect(widget).toHaveAttribute('data-form-full-listen-count', '1');
  await expect(widget.getByRole('button', { name: /A · 0/ })).toBeEnabled();
  await widget.getByRole('button', { name: 'Mostrar mapa de referencia' }).click();
  await expect(widget.locator('[data-form-answer-text]')).toContainText(/A — 2 compases; B — 2; A’ — 2; C — 2/);
});

test('U11 L2 exposes two original tonal contexts and never grades the answer', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/oido-tonal-util/');
  const widgets = page.locator('.musical-context');
  await expect(widgets).toHaveCount(2);
  const first = widgets.nth(0);
  await expect(first).toHaveAttribute('data-melody', '60,62,67,60');
  await expect(first).toHaveAttribute('data-context-listen-count', '0');
  await expect(first.locator('[data-context-answer-text]')).toBeHidden();
  await first.getByRole('button', { name: 'Escuchar secuencia tonal' }).click();
  await expect(first).toHaveAttribute('data-context-listen-count', '1');
  await first.getByRole('button', { name: 'Mostrar referencia' }).click();
  await expect(first.locator('[data-context-answer-text]')).toContainText(/Do4 → Re4 → Sol4 → Do4/);
  await expect(page.locator('[data-tonal-grader], [data-ear-grader]')).toHaveCount(0);
});

test('U11 L3 presents the original I-IV-V-I context as a bounded example', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/acordes-centro-tonal-tension-resolucion/');
  const widget = page.locator('.musical-context');
  await expect(widget).toHaveCount(1);
  await expect(widget).toHaveAttribute('data-chords', '60,64,67|65,69,72|67,71,74|60,64,67');
  await expect(widget.getByRole('button', { name: 'Sólo armonía' })).toBeVisible();
  await expect(page.locator('article.course-article').getByText(/no una ley universal para toda música/i)).toBeVisible();
  await widget.getByRole('button', { name: 'Mostrar referencia' }).click();
  await expect(widget.locator('[data-context-answer-text]')).toContainText(/I → IV → V → I en Do mayor/);
});

test('U11 L4 supports mix then layer isolation without turning bass-drums into copying', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/bajo-bateria-relacion-no-copia/');
  const widget = page.locator('.musical-context');
  await expect(widget).toHaveCount(1);
  await expect(widget.getByRole('button', { name: 'Escuchar mezcla' })).toBeVisible();
  await expect(widget.getByRole('button', { name: 'Sólo bajo' })).toBeVisible();
  await expect(widget.getByRole('button', { name: 'Sólo batería' })).toBeVisible();
  await widget.getByRole('button', { name: 'Escuchar mezcla' }).click();
  await widget.getByRole('button', { name: 'Sólo bajo' }).click();
  await widget.getByRole('button', { name: 'Sólo batería' }).click();
  await expect(widget).toHaveAttribute('data-context-listen-count', '3');
  const article = page.locator('article.course-article');
  await expect(article.getByText(/“el bombo toca lo mismo que el bajo”/)).toBeVisible();
  await expect(article.getByText(/coincidencia:/)).toBeVisible();
  await expect(article.getByText(/complemento:/)).toBeVisible();
});

test('U11 L5 keeps documented Take Five separate from analytical work and local notation', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/take-five-repertorio-documentado/');
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'EJEMPLO DOCUMENTADO' })).toBeVisible();
  await expect(article.getByRole('heading', { name: /EJEMPLO ANALÍTICO/ })).toBeVisible();
  await expect(article.getByText(/Paul Desmond/).first()).toBeVisible();
  await expect(article.getByText(/Joe Morello/).first()).toBeVisible();
  await expect(article.getByText(/Eugene Wright/).first()).toBeVisible();
  await expect(article.locator('a[href="https://www.youtube.com/watch?v=QsHc2IGmk60"]')).toHaveAttribute('target', '_blank');
  await expect(article.locator('[data-notation-score]')).toHaveCount(0);
  await expect(article.getByText(/No reproduce aquí la partitura, el audio master ni una transcripción extensa/)).toBeVisible();
});

test('U11 checkpoint exposes four listening modes, hidden reference and U12 minimum', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-11/ficha-analisis-integrado/');
  const widget = page.locator('.musical-context');
  await expect(widget).toHaveCount(1);
  for (const name of ['Escuchar mezcla', 'Sólo armonía', 'Sólo bajo', 'Sólo batería']) await expect(widget.getByRole('button', { name })).toBeVisible();
  await expect(widget.locator('[data-context-answer-text]')).toBeHidden();
  await widget.getByRole('button', { name: 'Escuchar mezcla' }).click();
  await expect(widget).toHaveAttribute('data-context-listen-count', '1');
  await widget.getByRole('button', { name: 'Mostrar referencia' }).click();
  await expect(widget.locator('[data-context-answer-text]')).toContainText(/bloque A — compases 1–4/);
  await expect(widget.locator('[data-context-answer-text]')).toContainText(/bloque B — compases 5–8/);
  const article = page.locator('article.course-article');
  await expect(article.getByRole('heading', { name: 'MÍNIMO PARA AVANZAR A U12' })).toBeVisible();
  await expect(article.getByText(/No es requisito para U12/)).toBeVisible();
});

test('U10 remains intact and U11 introduces no automatic musical-analysis grader', async ({ page }, testInfo) => {
  await login(page, testInfo); await page.goto('/bateria/fase-3-unidad-10/puerta-siete/');
  await expect(page.getByText(/J3 — MÍNIMO GLOBAL/)).toBeVisible();
  await page.goto('/bateria/fase-3-unidad-11/ficha-analisis-integrado/');
  await expect(page.locator('[data-analysis-grader], [data-tonal-grader], [data-ear-grader]')).toHaveCount(0);
});
