import { test, expect } from '@playwright/test';

test.describe('Dynamic Sidebar', () => {
  test('sidebar accessibility and fallback', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Large viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/');
    
    // Check if sidebar nav exists as an ARIA role
    const nav = page.getByRole('navigation', { name: /navigation/i }).first();
    await expect(nav).toBeAttached({ timeout: 15000 });
    
    const bodyText = await page.innerText('body');
    console.log('Body inner text:', bodyText);

    const buttons = await page.locator('button').all();
    console.log('Page has', buttons.length, 'buttons');
    for (const btn of buttons) {
      console.log('Button innerHTML:', await btn.innerHTML());
    }

    const menuBtn = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
    const exists = await menuBtn.count() > 0;
    console.log('Menu button with lucide-menu exists:', exists);
    if (exists) {
      await menuBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.keyboard.press('Control+b');
    await page.waitForTimeout(500);

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeAttached({ timeout: 15000 });
    
    const allLinks = await sidebar.locator('a').all();
    console.log('Sidebar has', allLinks.length, 'links');
    for (const link of allLinks) {
      console.log('Link text:', await link.innerText());
      console.log('Link HTML:', await link.innerHTML());
    }

    const homeLink = sidebar.locator('a').filter({ hasText: /home/i });
    await expect(homeLink).toBeAttached({ timeout: 15000 });

    const spanText = await homeLink.locator('span').allInnerTexts();
    console.log('Home link spans:', spanText);
  });
});
