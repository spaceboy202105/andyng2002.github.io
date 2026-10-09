import { test, expect } from '@playwright/test';

const pages = ['en/', 'zh/', 'en/publications/', 'zh/publications/', 'en/projects/', 'zh/projects/', 'en/blog/', 'zh/blog/', ...['sample-study', 'chinese-only', 'middle', 'newest'].flatMap(story => [`en/blog/${story}/`, `zh/blog/${story}/`]), '404.html'];

test('every subpath page loads local resources, CVs and fits mobile', async ({ page, request }, testInfo) => {
  const broken: string[] = [];
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4353') && response.status() >= 400 && !response.url().endsWith('/404.html')) broken.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => broken.push(request.url()));
  page.on('request', request => {
    if (request.url().startsWith('http://127.0.0.1:4353') && !new URL(request.url()).pathname.startsWith('/preview/')) broken.push(`Escaped base: ${request.url()}`);
  });
  await page.setViewportSize({ width: 360, height: 800 });
  for (const target of pages) {
    await page.goto(`/preview/${target}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), target).toBe(true);
    for (const image of await page.locator('img').all()) expect(await image.evaluate(el => el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0), target).toBe(true);
  }
  await page.goto('/preview/en/blog/sample-study/');
  await page.screenshot({ path: testInfo.outputPath('subpath-mobile-article.png'), fullPage: true });
  for (const locale of ['zh', 'en']) {
    const link = page.locator(`a[href="/preview/cv/${locale}.pdf"]`).first();
    await expect(link).toBeVisible();
    const response = await request.get((await link.getAttribute('href'))!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }
  expect(broken).toEqual([]);
});

test('subpath navigation, Markdown targets and translations retain their destinations', async ({ page }) => {
  await page.goto('/preview/');
  await expect(page).toHaveURL('/preview/en/');
  const nav = page.getByRole('navigation').first();
  await nav.getByRole('link', { name: 'Research', exact: true }).click();
  await expect(page).toHaveURL('/preview/en/publications/');
  await nav.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL('/preview/en/projects/');
  await nav.getByRole('link', { name: 'Blog', exact: true }).click();
  await page.getByRole('link', { name: 'Sample Research Article', exact: true }).click();
  await expect(page).toHaveURL('/preview/en/blog/sample-study/');
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Results', exact: true }).click();
  await expect(page).toHaveURL('/preview/en/blog/sample-study/#results');
  await page.getByRole('link', { name: 'All projects', exact: true }).click();
  await expect(page).toHaveURL('/preview/en/projects/');
  await page.goto('/preview/en/blog/sample-study/');
  await page.locator('a[href="/preview/en/projects/#selected"]').click();
  await expect(page.locator('#selected')).toBeVisible();
  await page.goto('/preview/en/blog/sample-study/');
  await page.getByRole('link', { name: '阅读中文版本', exact: true }).click();
  await expect(page).toHaveURL('/preview/zh/blog/sample-study/');
  await expect(page.locator('article')).toHaveAttribute('lang', 'zh');
  await page.goto('/preview/en/blog/chinese-only/');
  await expect(page.locator('article')).toHaveAttribute('lang', 'zh');
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL('/preview/zh/blog/chinese-only/');
  await page.goto('/preview/');
  await expect(page).toHaveURL('/preview/zh/');
  await page.goto('/preview/en/');
  await expect(page).toHaveURL('/preview/en/');
  await expect(page.getByRole('link', { name: 'Email', exact: true }).first()).toHaveAttribute('href', 'mailto:researcher@example.org');
});

test('subpath language switching survives unavailable storage and 404 returns home', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
  await page.goto('/preview/');
  await expect(page).toHaveURL('/preview/en/');
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL('/preview/zh/');
  await page.goto('/preview/not-a-page/');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: '返回首页', exact: true }).click();
  await expect(page).toHaveURL('/preview/zh/');
  expect(errors).toEqual([]);
});
