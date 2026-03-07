import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
  geolocation: { latitude: -33.4489, longitude: -70.6693 },
  permissions: ['geolocation'],
});

test('Ruta Verde Full User Flow - Debug', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.screenshot({ path: 'debug_initial.png' });

  const input = page.locator('input[placeholder="Tu nombre..."]');
  if (await input.isVisible()) {
      await input.fill('TestUser');
      await page.click('button:has-text("Comenzar")');
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug_after_onboard.png' });

  // Check if we are in dashboard
  const welcome = page.locator('h2');
  console.log('H2 texts:', await welcome.allTextContents());

  await page.click('nav button:has-text("Explorar")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'debug_map.png' });
});
