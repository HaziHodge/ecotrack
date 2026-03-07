import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
  geolocation: { latitude: -33.4489, longitude: -70.6693 },
  permissions: ['geolocation'],
});

test('Ruta Verde Full User Flow - Corrected v2', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Onboarding
  const input = page.locator('input[placeholder="Tu nombre..."]');
  if (await input.isVisible()) {
      await input.fill('TestUser');
      await page.click('button:has-text("Comenzar")');
  }

  // Dashboard
  await expect(page.locator('h2:has-text("Bien!")')).toBeVisible();

  // Search Flow
  await page.click('nav button:has-text("Explorar")');
  await page.fill('input[placeholder="Buscar destino..."]', 'Costanera Center');

  // Choose suggested route or fallback search result
  // Instead of clicking suggestion, let's try to find the "Ver Opciones" which appears after a selection
  // In the current code, handleSearch is called onSearchSelect.

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'flow_v2_search.png' });

  // Let's force a search selection if the UI suggestion didn't work
  const suggestion = page.locator('div:has-text("Costanera Center")').first();
  await suggestion.click();

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'flow_v2_after_click.png' });

  // Verification: Plan button should appear
  const planBtn = page.locator('button:has-text("Ver Opciones de Ruta")');
  await expect(planBtn).toBeVisible({ timeout: 10000 });
  await planBtn.click();

  // Start Navigation
  await expect(page.locator('h2:has-text("Planifica Viaje")')).toBeVisible();
  await page.click('button:has-text("Comenzar Ruta")');

  // Navigation
  await expect(page.locator('button:has-text("X")')).toBeVisible();
  await page.click('button:has-text("Finalizar Viaje")');

  // Verification after trip
  await expect(page.locator('text=¡Viaje finalizado!')).toBeVisible();

  await page.screenshot({ path: 'final_flow_success.png' });
});
