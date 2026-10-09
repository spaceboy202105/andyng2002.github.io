import { test, expect } from '@playwright/test';

for (const width of [1280, 360]) test(`projects show only owner-selected work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/zh/projects/');
  await expect(page.getByRole('heading', { name: '已选项目', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: '已选项目截图', exact: true })).toBeVisible();
  await expect(page.getByText('设计并实现工具', { exact: true })).toBeVisible();
  await expect(page.getByText('未选项目', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /演示|Demo/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/projects\/$/);
  await expect(page.getByRole('heading', { name: 'Selected Project', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Code', exact: true })).toHaveAttribute('href', 'https://example.org/code');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.getByRole('img', { name: 'Selected project screenshot', exact: true }).evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
});
