import { test, expect } from '@playwright/test';

test('publication list excludes unapproved work and keeps official title', async ({ page }) => {
  await page.goto('/en/publications/');
  await expect(page.getByRole('heading', { name: 'Sample Published Paper' })).toBeVisible();
  await expect(page.getByText('Unapproved Paper', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Code', exact: true })).toHaveCount(0);
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.locator('#ordinary').getByRole('link', { name: 'arXiv', exact: true })).toHaveAttribute('href', 'https://arxiv.org/abs/0000.00000');
  await expect(page.locator('#featured').getByRole('link', { name: 'Paper', exact: true })).toHaveAttribute('href', 'https://example.org/paper');
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/publications\/$/);
  await expect(page.getByRole('heading', { name: 'Sample Published Paper' })).toBeVisible();
  await expect(page.getByText('示例研究贡献', { exact: true })).toBeVisible();
  await expect(page.getByText('预印本', { exact: true })).toBeVisible();
  await expect(page.locator('#ordinary').getByRole('link', { name: 'arXiv', exact: true })).toBeVisible();
  await expect(page.locator('#featured').getByRole('link', { name: '论文', exact: true })).toBeVisible();
});

for (const locale of ['en', 'zh']) test(`${locale} author links preserve ordered plain and linked names on homepage and list`, async ({ page }) => {
  for (const route of [`/${locale}/`, `/${locale}/publications/`]) {
    await page.goto(route);
    const authors = page.locator('#featured .authors');
    await expect(authors).toHaveText('Researcher One, Researcher Two');
    await expect(authors.getByRole('link', { name: 'Researcher Two', exact: true })).toHaveAttribute('href', 'https://example.org/researcher-two');
    await expect(authors.getByRole('link')).toHaveCount(1);
  }
});

for (const locale of ['en', 'zh']) test(`${locale} every paper has a loaded representative image beside desktop text and above mobile text`, async ({ page }) => {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [`/${locale}/`, `/${locale}/publications/`]) {
      await page.goto(route);
      const papers = page.locator('article').filter({ has: page.locator('.authors') });
      expect(await papers.count()).toBeGreaterThan(0);
      for (const paper of await papers.all()) {
        const image = paper.getByRole('img');
        await expect(image).toBeVisible();
        await expect(image).not.toHaveAttribute('alt', '');
        expect(await image.evaluate(el => el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0)).toBe(true);
        const figure = (await image.boundingBox())!;
        const title = (await paper.getByRole('heading').boundingBox())!;
        if (width > 680) expect(figure.x + figure.width).toBeLessThanOrEqual(title.x);
        else expect(figure.y + figure.height).toBeLessThanOrEqual(title.y);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
