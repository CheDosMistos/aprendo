import { expect, test } from '@playwright/test';

test('las unidades de una fase solo muestran contenido real', async ({ page }) => {
  await page.goto('/bateria/?fase=2');
  await expect(page.locator('.stats')).toContainText('Fase 2: 11 unidades activas');
  const phase2UnitNames = [
    '00 — Inicio',
    '1 — Pulso interno I',
    '2 — Subdivisión I',
    '3 — Silencios y continuidad',
    '4 — Síncopa I',
    '5 — Tresillos y sextillos',
    '6 — Lectura a primera vista I',
    '7 — Click reducido I',
    '8 — Rudimentos aplicados I',
    '9 — Oído rítmico y dictado I',
    '10 — Cierre',
  ];

  for (const name of phase2UnitNames) {
    await expect(page.locator('.section-title', { hasText: name })).toBeVisible();
  }

  await page.goto('/bateria/?fase=1');
  await expect(page.locator('.stats')).toContainText('Fase 1: 9 unidades activas');
  await expect(page.locator('.section-title').filter({ hasText: '2 — Double Stroke Open Roll' })).toBeVisible();
  await expect(page.locator('.section-title').filter({ hasText: 'Checkpoint U2' })).toHaveCount(0);

  await page.goto('/bateria/?fase=3');
  await expect(page.locator('.stats')).toContainText('Fase 3: 8 unidades activas');
  await expect(page.locator('.section-title', { hasText: '5 — 5/4 y 7/8' })).toBeVisible();
  await expect(page.locator('.section-title', { hasText: '6 — Audición y análisis' })).toBeVisible();
});

test('las fases 4–7 reflejan si hay contenido disponible', async ({ page }) => {
  await page.goto('/bateria/');
  const phase4 = page.getByRole('button', { name: /Fase 4/ });
  const phase5 = page.getByRole('button', { name: /Fase 5/ });
  const phase6 = page.getByRole('button', { name: /Fase 6/ });
  const phase7 = page.getByRole('button', { name: /Fase 7/ });
  await expect(phase4).toBeDisabled();
  await expect(phase4).toHaveClass(/is-coming/);
  await expect(phase5).toBeEnabled();
  await expect(phase6).toBeEnabled();
  await expect(phase7).toBeEnabled();
});
