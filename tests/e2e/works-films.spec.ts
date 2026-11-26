import { test, expect } from '@playwright/test';

for (const width of [1280, 900, 768, 700, 680, 360, 320]) test(`new navigation and image rows fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}/`);
    await expect(page.locator('#hobbies svg[aria-hidden="true"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const menu = page.getByRole('button', { name: locale === 'en' ? 'Menu' : '菜单', exact: true });
    if (await menu.isVisible()) await menu.click();
    const nav = page.getByRole('navigation');
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

for (const locale of ['en', 'zh']) test(`${locale} navigation works without JavaScript and identifies the current page`, async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  await page.goto(`/${locale}/`);
  await expect(page.getByRole('navigation')).toHaveCount(1);
  const menu = page.getByRole('button', { name: locale === 'en' ? 'Menu' : '菜单', exact: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  const current = page.getByRole('navigation').locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', `/${locale}/`);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(current).toBeHidden();
  await menu.click();
  await page.getByRole('navigation').getByRole('link', { name: locale === 'en' ? 'Works' : '作品展示', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/works/$`));
  await menu.click();
  await expect(current).toHaveAttribute('href', `/${locale}/works/`);
  await context.close();
});

for (const locale of ['en', 'zh']) test(`${locale} open navigation returns inline when the header grows`, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/${locale}/`);
  const menu = page.getByRole('button', { name: locale === 'en' ? 'Menu' : '菜单', exact: true });
  const links = page.getByRole('navigation').getByRole('list', { includeHidden: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(links).toBeVisible();
  await expect(links).toHaveAttribute('popover', 'auto');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(menu).toBeHidden();
  await expect(links).not.toHaveAttribute('popover');
  await expect(links).toBeVisible();
  const header = (await page.locator('.site-header').boundingBox())!;
  const inline = (await links.boundingBox())!;
  expect(inline.x).toBeGreaterThanOrEqual(header.x);
  expect(inline.x + inline.width).toBeLessThanOrEqual(header.x + header.width);
  expect(inline.y).toBeGreaterThanOrEqual(header.y);
  expect(inline.y + inline.height).toBeLessThanOrEqual(header.y + header.height);
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(menu).toBeVisible();
  await expect(links).toHaveAttribute('popover', 'auto');
  await expect(links).toBeHidden();
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(links).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(links.getByRole('link').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(links).toBeHidden();
  await expect(menu).toBeFocused();
});
