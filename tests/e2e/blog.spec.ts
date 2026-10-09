import { test, expect } from '@playwright/test';

test('single-language story stays visible in both interfaces', async ({ page }) => {
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}/blog/`);
    await expect(page.getByRole('link', { name: '单语研究记录', exact: true })).toBeVisible();
    expect(await page.locator('.blog-list article').count()).toBe(4);
  }
  await page.goto('/en/blog/chinese-only/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('article')).toHaveAttribute('lang', 'zh');
  await expect(page.getByText('这篇文章只有中文正文。', { exact: true })).toBeVisible();
  await expect(page.getByText('Original language: Chinese', { exact: true })).toBeVisible();
  await expect(page.getByText('Unapproved translation')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Read English version' })).toHaveCount(0);
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/blog\/chinese-only\/$/);
});

test('translated story retains identity', async ({ page }) => {
  await page.goto('/en/blog/sample-study/');
  await expect(page.locator('article')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('The translated research article.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '阅读中文版本', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/blog\/sample-study\/$/);
  await page.reload();
  await expect(page.locator('article')).toHaveAttribute('lang', 'zh');
  await expect(page.getByText('这是研究文章的中文原文。', { exact: true })).toBeVisible();
});

for (const width of [1280, 360]) test(`article math, highlighted code, figures and headings work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/en/blog/sample-study/');
  await expect(page.locator('.katex-display')).toBeVisible();
  await expect(page.locator('pre .token').first()).toBeVisible();
  expect(await page.locator('pre .token').first().evaluate(el => getComputedStyle(el).color)).not.toBe(await page.locator('pre').evaluate(el => getComputedStyle(el).color));
  await expect(page.locator('.article-body p:has(img) + p')).toHaveText('Figure 1. A synthetic diagram for reading checks.');
  expect(await page.getByRole('img', { name: 'Synthetic diagram' }).evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
  if (width === 360) expect(await page.getByRole('img', { name: 'Synthetic diagram' }).evaluate(image => image instanceof HTMLImageElement && image.getBoundingClientRect().height <= image.getBoundingClientRect().width * image.naturalHeight / image.naturalWidth + 1)).toBe(true);
  await expect(page.getByText('2026-04-04', { exact: true })).toBeVisible();
  await expect(page.getByText('Geometry', { exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Results', exact: true }).click();
  await expect(page).toHaveURL(/#results$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('pre').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
});
