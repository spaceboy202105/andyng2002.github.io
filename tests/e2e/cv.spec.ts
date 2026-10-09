import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('both CV links download distinct final PDFs in either interface', async ({ page }, testInfo) => {
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}/`);
    const bytes = [];
    for (const label of ['中文 CV', 'English CV']) {
      const link = page.getByRole('link', { name: label, exact: true }).first();
      await expect(link).toBeVisible();
      const downloaded = page.waitForEvent('download');
      await link.click();
      const download = await downloaded;
      const file = await download.path();
      expect(file).not.toBeNull();
      if (!file) throw new Error('Downloaded PDF has no file');
      const pdf = await readFile(file);
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      bytes.push(pdf);
    }
    expect(bytes[0].equals(bytes[1])).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`cv-${locale}.png`), fullPage: true });
  }
});
