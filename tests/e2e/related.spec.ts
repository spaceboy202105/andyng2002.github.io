import { test, expect } from '@playwright/test';

for (const width of [1280, 360]) test(`homepage combines only featured work and latest approved stories at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/zh/');
  await expect(page.getByRole('heading', { name: 'Sample Published Paper', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '已选项目', exact: true })).toBeVisible();
  await expect(page.getByText('普通非精选项目', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ordinary Preprint', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Unapproved Paper', { exact: true })).toHaveCount(0);
  await expect(page.locator('.blog-list h2 a')).toHaveText(['Newest Research Note', '示例研究文章', 'Middle Research Note']);
  await expect(page.getByRole('link', { name: '单语研究记录', exact: true })).toHaveCount(0);
  expect(await page.locator('main > section').evaluateAll(sections => sections.map(section => section.id))).toEqual(['profile', 'research', 'projects', 'blog']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('related reading preserves locale in both directions', async ({ page }) => {
  await page.goto('/zh/projects/');
  await page.getByRole('link', { name: '示例研究文章', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/blog\/sample-study\/$/);
  await page.getByRole('link', { name: '相关论文：Sample Published Paper', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/publications\/#featured$/);
  await page.getByRole('link', { name: '示例研究文章', exact: true }).click();
  await page.getByRole('link', { name: '相关项目：已选项目', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/projects\/#selected$/);
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await page.getByRole('link', { name: 'Sample Research Article', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/sample-study\/$/);
});
