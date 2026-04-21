# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend/e2e/sidebar.spec.ts >> Dynamic Sidebar >> sidebar accessibility and fallback
- Location: frontend/e2e/sidebar.spec.ts:4:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dynamic Sidebar', () => {
  4  |   test('sidebar accessibility and fallback', async ({ page }) => {
  5  |     page.on('console', msg => console.log('BROWSER:', msg.text()));
  6  | 
  7  |     // Large viewport
  8  |     await page.setViewportSize({ width: 1440, height: 900 });
  9  | 
> 10 |     await page.goto('/');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  11 |     
  12 |     // Check if sidebar nav exists as an ARIA role
  13 |     const nav = page.getByRole('navigation', { name: /navigation/i }).first();
  14 |     await expect(nav).toBeAttached({ timeout: 15000 });
  15 |     
  16 |     const bodyText = await page.innerText('body');
  17 |     console.log('Body inner text:', bodyText);
  18 | 
  19 |     const buttons = await page.locator('button').all();
  20 |     console.log('Page has', buttons.length, 'buttons');
  21 |     for (const btn of buttons) {
  22 |       console.log('Button innerHTML:', await btn.innerHTML());
  23 |     }
  24 | 
  25 |     const menuBtn = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
  26 |     const exists = await menuBtn.count() > 0;
  27 |     console.log('Menu button with lucide-menu exists:', exists);
  28 |     if (exists) {
  29 |       await menuBtn.click();
  30 |       await page.waitForTimeout(1000);
  31 |     }
  32 | 
  33 |     await page.keyboard.press('Control+b');
  34 |     await page.waitForTimeout(500);
  35 | 
  36 |     const sidebar = page.locator('aside');
  37 |     await expect(sidebar).toBeAttached({ timeout: 15000 });
  38 |     
  39 |     const allLinks = await sidebar.locator('a').all();
  40 |     console.log('Sidebar has', allLinks.length, 'links');
  41 |     for (const link of allLinks) {
  42 |       console.log('Link text:', await link.innerText());
  43 |       console.log('Link HTML:', await link.innerHTML());
  44 |     }
  45 | 
  46 |     const homeLink = sidebar.locator('a').filter({ hasText: /home/i });
  47 |     await expect(homeLink).toBeAttached({ timeout: 15000 });
  48 | 
  49 |     const spanText = await homeLink.locator('span').allInnerTexts();
  50 |     console.log('Home link spans:', spanText);
  51 |   });
  52 | });
  53 | 
```