import { test, expect } from '@playwright/test';

test('RUTA VERDE Full Flow Verification', async ({ page }) => {
  await page.goto('/');

  // 1. Onboarding
  await page.click('button:has-text("Empezar")');
  await page.click('button:has-text("Santiago")');
  await page.fill('input[placeholder="Tu nombre..."]', 'Jules Engineer');
  await page.click('button:has-text("Comenzar Aventura")');

  // 2. Dashboard
  await expect(page.locator('h1')).toContainText('Hola, Jules Engineer');

  // 3. Navigation to Rutas
  await page.click('nav button:has-text("Rutas")');
  await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 15000 });

  // 4. Start Route
  await page.click('button:has-text("Iniciar ruta")');
  // Check for navigation toast
  await expect(page.locator('text=/Navegando/i')).toBeVisible();

  // 5. Active Navigation Check
  await expect(page.locator('text=/Paso 1/i')).toBeVisible();

  // 6. Finish Route
  await page.click('button:has-text("Finalizar viaje anticipado")');
  // Check for arrival toast
  await expect(page.locator('text=/¡Llegaste!/i')).toBeVisible();

  // 7. Navigation to Puntos
  await page.click('nav button:has-text("Puntos")');

  // 8. Easter Egg
  const logo = page.locator('span:has-text("RUTA VERDE")').first();
  for(let i = 0; i < 5; i++) {
    await logo.click();
  }
  await expect(page.locator('text=/Tú sí que eres verde/i')).toBeVisible();

  // 9. Profile
  await page.click('nav button:has-text("Perfil")');
  await expect(page.locator('h2', { hasText: 'Jules Engineer' })).toBeVisible();

  console.log('Verification successful!');
});
