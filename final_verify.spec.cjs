const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 375, height: 812 } }); // iPhone X/11/12/13/14

test('Final Frontend Verification', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('input[placeholder="Tu nombre..."]', 'Vercel Deploy');
  await page.click('button:has-text("Comenzar")');

  // Dashboard
  await expect(page.locator('text=Hola, Vercel Deploy')).toBeVisible();

  // Map Exploration
  await page.click('button:has-text("Explorar")');
  await page.waitForTimeout(5000);

  // Screenshot of the Map with UI
  await page.screenshot({ path: 'final_ui_verification.png' });
});
