import { test, expect } from '@playwright/test';

test('Check for console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  await page.goto('http://localhost:5173');

  // 1. Onboarding
  await page.click('button:has-text("Empezar")');
  await page.click('button:has-text("Santiago")');
  await page.fill('input[placeholder="Tu nombre..."]', 'Jules');
  await page.click('button:has-text("Comenzar Aventura")');

  // 2. Interactive parts
  await page.click('nav button:has-text("Mapa")');
  await page.waitForTimeout(1000);
  await page.click('nav button:has-text("Rutas")');
  await page.waitForTimeout(1000);
  await page.click('nav button:has-text("Puntos")');
  await page.waitForTimeout(1000);
  await page.click('nav button:has-text("Perfil")');
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.error('Console errors found:', errors);
    process.exit(1);
  } else {
    console.log('No console errors found.');
  }
});
