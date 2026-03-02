import { test, expect } from '@playwright/test';

test('RUTA VERDE Full Flow Verification', async ({ page }) => {
  // Set viewport to mobile to test mobile layout
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('http://localhost:5173');

  // 1. Onboarding
  const nameInput = page.locator('input[placeholder="Escribe tu nombre..."]');
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill('Jules Engineer');
  await page.click('button:has-text("Comenzar Aventura")');

  // 2. Dashboard Verification
  await expect(page.locator('h1:has-text("Hola, Jules Engineer 👋")')).toBeVisible();
  await expect(page.locator('text=Tu impacto hoy')).toBeVisible();

  // 3. Navigation to Rutas
  await page.click('nav button:has-text("Rutas")');

  // 4. Skeleton Loader & Map Check
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });

  // 5. Start Route
  const startBtn = page.locator('button:has-text("Iniciar ruta")');
  await expect(startBtn).toBeVisible();

  // Ensure button is clickable (not intercepted)
  await startBtn.click();

  // 6. Toast Verification
  await expect(page.locator('text=¡Ruta iniciada!')).toBeVisible();

  // 7. Navigation to Puntos
  await page.click('nav button:has-text("Puntos")');
  await expect(page.locator('text=BROTE VERDE')).toBeVisible();
  await expect(page.locator('text=1290')).toBeVisible(); // 1240 + 50

  // 8. Easter Egg Check (Click logo 5 times)
  const logo = page.locator('span:has-text("RUTA VERDE")').first();
  for(let i = 0; i < 5; i++) {
    await logo.click();
  }
  await expect(page.locator('text=¡Tú sí que eres verde!')).toBeVisible();

  // 9. Profile and Stats
  await page.click('nav button:has-text("Perfil")');
  await expect(page.locator('h2:has-text("Jules Engineer")')).toBeVisible();
  await expect(page.locator('text=12.4kg')).toBeVisible();

  // 10. Persistence Check
  await page.reload();
  await expect(page.locator('h2:has-text("Jules Engineer")')).toBeVisible();
  await expect(page.locator('text=1290')).toBeVisible();

  console.log('Verification successful!');
});
