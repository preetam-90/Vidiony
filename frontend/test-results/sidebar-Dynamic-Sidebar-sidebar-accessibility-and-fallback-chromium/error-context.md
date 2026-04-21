# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sidebar.spec.ts >> Dynamic Sidebar >> sidebar accessibility and fallback
- Location: frontend/e2e/sidebar.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('aside').locator('a').filter({ hasText: /home/i })
Expected: attached
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 15000ms
  - waiting for locator('aside').locator('a').filter({ hasText: /home/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e6]:
      - complementary "Desktop navigation" [ref=e7]:
        - link "Go to homepage" [ref=e9] [cursor=pointer]:
          - /url: /
          - img [ref=e11]
          - generic [ref=e13]: Vidiony
        - navigation "Main navigation links" [ref=e14]
        - region "Primary navigation" [ref=e66]:
          - link "Settings" [ref=e67] [cursor=pointer]:
            - /url: /settings
            - img [ref=e69]
            - generic [ref=e72]: Settings
      - banner [ref=e73]:
        - generic [ref=e74]:
          - generic [ref=e75]:
            - button [active] [ref=e76]:
              - img
            - link "Vidiony" [ref=e77] [cursor=pointer]:
              - /url: /
              - img [ref=e79]
              - generic [ref=e81]: Vidiony
          - generic [ref=e84]:
            - generic [ref=e85]:
              - img [ref=e87]
              - textbox "Search videos, channels, topics..." [ref=e90]
            - button [ref=e91]:
              - img [ref=e92]
          - link "Sign In" [ref=e96] [cursor=pointer]:
            - /url: /auth/login
      - generic [ref=e100]:
        - generic [ref=e101]:
          - button "✨ All" [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]: ✨
              - text: All
          - button "🎮 Gaming" [ref=e105]:
            - generic [ref=e106]:
              - generic [ref=e107]: 🎮
              - text: Gaming
          - button "🎵 Music" [ref=e108]:
            - generic [ref=e109]:
              - generic [ref=e110]: 🎵
              - text: Music
          - button "💻 Programming" [ref=e111]:
            - generic [ref=e112]:
              - generic [ref=e113]: 💻
              - text: Programming
          - button "🎙️ Podcasts" [ref=e114]:
            - generic [ref=e115]:
              - generic [ref=e116]: 🎙️
              - text: Podcasts
          - button "🤖 AI" [ref=e117]:
            - generic [ref=e118]:
              - generic [ref=e119]: 🤖
              - text: AI
          - button "📰 News" [ref=e120]:
            - generic [ref=e121]:
              - generic [ref=e122]: 📰
              - text: News
          - button "🔴 Live" [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]: 🔴
              - text: Live
          - button "🔬 Science" [ref=e126]:
            - generic [ref=e127]:
              - generic [ref=e128]: 🔬
              - text: Science
          - button "⚽ Sports" [ref=e129]:
            - generic [ref=e130]:
              - generic [ref=e131]: ⚽
              - text: Sports
          - button "🍳 Cooking" [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]: 🍳
              - text: Cooking
          - button "🎬 Film & TV" [ref=e135]:
            - generic [ref=e136]:
              - generic [ref=e137]: 🎬
              - text: Film & TV
          - button "📚 Education" [ref=e138]:
            - generic [ref=e139]:
              - generic [ref=e140]: 📚
              - text: Education
          - button "💪 Fitness" [ref=e141]:
            - generic [ref=e142]:
              - generic [ref=e143]: 💪
              - text: Fitness
          - button "✈️ Travel" [ref=e144]:
            - generic [ref=e145]:
              - generic [ref=e146]: ✈️
              - text: Travel
          - button "🎨 Design" [ref=e147]:
            - generic [ref=e148]:
              - generic [ref=e149]: 🎨
              - text: Design
        - button [ref=e150]:
          - img [ref=e151]
      - main [ref=e154]:
        - generic [ref=e670]: For You
      - contentinfo [ref=e771]:
        - generic [ref=e772]:
          - generic [ref=e773]:
            - img [ref=e775]
            - generic [ref=e777]: VidionVideo Discovery
          - generic [ref=e778]:
            - link "About" [ref=e779] [cursor=pointer]:
              - /url: /about
            - link "Help" [ref=e780] [cursor=pointer]:
              - /url: /help
            - link "Terms" [ref=e781] [cursor=pointer]:
              - /url: /terms
            - link "Privacy" [ref=e782] [cursor=pointer]:
              - /url: /privacy
          - paragraph [ref=e783]: © 2026 Vidion. All rights reserved.
    - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e789] [cursor=pointer]:
    - img [ref=e790]
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
  10 |     await page.goto('/');
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
> 47 |     await expect(homeLink).toBeAttached({ timeout: 15000 });
     |                            ^ Error: expect(locator).toBeAttached() failed
  48 | 
  49 |     const spanText = await homeLink.locator('span').allInnerTexts();
  50 |     console.log('Home link spans:', spanText);
  51 |   });
  52 | });
  53 | 
```