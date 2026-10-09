import { test, expect } from '@playwright/test';

test('publication list excludes unapproved work and keeps official title', async ({ page }) => {
  await page.goto('/en/publications/');
  await expect(page.getByRole('heading', { name: 'Sample Published Paper' })).toBeVisible();
  await expect(page.getByText('Unapproved Paper', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Code', exact: true })).toHaveCount(0);
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/publications\/$/);
  await expect(page.getByRole('heading', { name: 'Sample Published Paper' })).toBeVisible();
  await expect(page.getByText('示例研究贡献', { exact: true })).toBeVisible();
  await expect(page.getByText('预印本', { exact: true })).toBeVisible();
});
