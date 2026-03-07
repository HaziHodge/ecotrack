import { test, expect } from '@playwright/test';

test('Capture Navigation UI', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Onboarding
  await page.click('button:has-text("Empezar")');
  await page.click('button:has-text("Santiago")');
  await page.fill('input[placeholder="Tu nombre..."]', 'Jules Engineer');
  await page.click('button:has-text("Comenzar Aventura")');

  // 2. Search
  await page.fill('input[placeholder="¿A dónde?"]', 'Costanera Center');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');

  // 3. Start Route
  await page.click('button:has-text("Iniciar ruta")');
  await page.waitForTimeout(2000);

  // 4. Screenshot of Active Navigation
  await page.screenshot({ path: '/home/jules/verification/navigation_active.png', fullPage: true });

  console.log('Screenshot taken!');
});
