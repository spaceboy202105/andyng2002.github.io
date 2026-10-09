import { test, expect } from '@playwright/test';

test('missing final CV hides only that entry', async ({ page }, testInfo) => {
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}/`);
    await expect(page.getByRole('link', { name: '中文 CV', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'English CV', exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`missing-${locale}.png`), fullPage: true });
  }
});
