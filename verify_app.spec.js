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
  await expect(page.locator('text=/Ruta iniciada/i')).toBeVisible();

  // 5. Navigation to Puntos
  await page.click('nav button:has-text("Puntos")');
  const badgeElement = page.locator('h2.uppercase');
  await expect(badgeElement).toBeVisible({ timeout: 10000 });
  const badgeTextBefore = await badgeElement.innerText();

  // 6. Easter Egg
  const logo = page.locator('span:has-text("RUTA VERDE")').first();
  for(let i = 0; i < 5; i++) {
    await logo.click();
  }
  await expect(page.locator('text=/Tú sí que eres verde/i')).toBeVisible();

  // 7. Profile
  await page.click('nav button:has-text("Perfil")');
  await expect(page.locator('h2', { hasText: 'Jules Engineer' })).toBeVisible();

  // 8. Persistence Check
  await page.reload();
  // After reload, we should be on Home if onboarding was complete
  await expect(page.locator('h1')).toContainText('Hola, Jules Engineer');

  // Navigate back to profile and verify
  await page.click('nav button:has-text("Perfil")');
  await expect(page.locator('h2', { hasText: 'Jules Engineer' })).toBeVisible();

  console.log('Verification successful!');
});
