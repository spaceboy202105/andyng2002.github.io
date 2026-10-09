import { expect, test } from '@playwright/test';

test('home always defaults to English and allows explicit Chinese pages', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.getByRole('heading', { name: 'Test Researcher', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
});

test('legacy stored Chinese cannot override the English entry or explicit URLs', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('site-language', 'zh'));
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto('/zh/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await page.goto('/en/');
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.getByRole('heading', { name: 'Test Researcher', level: 1 })).toBeVisible();
});

test('language works when storage is denied', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page.getByRole('heading', { name: '测试研究者', level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('English content and language links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Test Researcher', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page.getByRole('heading', { name: '测试研究者', level: 1 })).toBeVisible();
  await context.close();
});

test('mobile navigation, contact names, keyboard focus and reduced motion remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  expect(await page.locator(':focus').evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.getByText('Menu', { exact: true }).click();
  await page.getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/#contact$/);
  for (const name of ['Email', 'Google Scholar', 'GitHub', 'ORCID']) {
    await expect(page.getByRole('contentinfo').getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /CV/ })).toHaveCount(0);
  expect(await page.getByRole('link', { name: 'Email', exact: true }).first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).scrollBehavior)).toBe('auto');
  await page.getByRole('link', { name: '中文', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('404 offers working homepage links in both languages', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: '返回首页', exact: true }).click();
  await expect(page.getByRole('heading', { name: '测试研究者', level: 1 })).toBeVisible();
});

test('long unbroken biography stays within a narrow viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/');
  await expect(page.getByText(/https:\/\/research.example.org\/GeometryAwareAutoregressiveBoundaryRepresentationGeneration/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath('long-bio.png'), fullPage: true });
});

for (const locale of ['en', 'zh']) {
  test(`education and internships render in ${locale} on desktop and mobile`, async ({ page }) => {
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/${locale}/`);
      const education = page.locator('#education');
      await expect(education.getByRole('heading', { name: locale === 'en' ? 'Example University' : '示例大学' })).toBeVisible();
      await expect(education.getByRole('link', { name: locale === 'en' ? 'Example Advisor' : '示例导师' })).toHaveAttribute('href', 'https://example.org/advisor');
      await expect(education).toContainText(locale === 'en' ? '2024 - 2027 (expected)' : '2024 - 2027（预计）');
      const internships = page.locator('#internships');
      await expect(internships).toContainText(locale === 'en' ? 'Example Company · Example City' : '示例公司 · 示例城市');
      await expect(internships.getByRole('link', { name: locale === 'en' ? 'Example Company' : '示例公司' })).toHaveAttribute('href', locale === 'en' ? 'https://example.org/company' : 'https://example.org/zh/company');
      await expect(internships).toContainText(locale === 'en' ? 'Example Researcher' : '示例研究员');
      await expect(internships).toContainText(locale === 'en' ? '2026 - Present' : '2026 - 至今');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
