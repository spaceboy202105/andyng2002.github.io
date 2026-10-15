import { test, expect } from '@playwright/test';

for (const width of [1280, 900, 768, 700, 680, 360, 320]) test(`new navigation and image rows fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}/`);
    await expect(page.locator('#hobbies svg[aria-hidden="true"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width <= 800) await page.locator('.mobile-nav summary').click();
    const nav = page.locator(width <= 800 ? '.mobile-nav nav' : '.desktop-nav');
    await expect(nav.getByRole('link', { name: locale === 'en' ? 'Works' : '作品展示', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: locale === 'en' ? 'Films' : '电影评论', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(`/${locale}/projects/`);
    const picture = page.locator('#selected img');
    await picture.scrollIntoViewIfNeeded();
    await picture.evaluate(image => (image as HTMLImageElement).decode());
    const imageBox = (await picture.boundingBox())!;
    const titleBox = (await page.locator('#selected h2').boundingBox())!;
    if (width > 680) expect(imageBox.x + imageBox.width).toBeLessThan(titleBox.x);
    else expect(imageBox.y + imageBox.height).toBeLessThan(titleBox.y);
    const blank = page.locator('#ordinary .project-cover-blank');
    if (width > 680) await expect(blank).toBeVisible();
    else await expect(blank).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('gallery and film reviews retain language and approved content', async ({ page }) => {
  await page.goto('/en/works/');
  await expect(page.getByRole('img', { name: 'Synthetic landscape' })).toBeVisible();
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/zh\/works\/$/);
  await expect(page.getByRole('img', { name: '合成风景' })).toBeVisible();
  await page.goto('/en/films/');
  await expect(page.locator('.blog-list h2')).toHaveText(['示例影评', 'Older review']);
  await page.getByRole('link', { name: '示例影评', exact: true }).click();
  await expect(page.locator('.research-article')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('.article-languages')).toContainText('中文');
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/zh\/films\/review\/$/);
  await expect(page.locator('.article-body')).toContainText('这是用于检查的合成电影评论');
});
