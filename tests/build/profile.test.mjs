import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

test('profile rejects an unsafe contact URL at the build boundary', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/profile/main.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace('mailto:researcher@example.org', 'javascript:alert(1)'));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /contacts[\s\S]*href/);
  });
});

test('profile requires both biography languages', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/profile/main.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace('  zh: 用于浏览器检查的合成简介。\n', ''));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /bio[\s\S]*zh/);
  });
});

test('exactly one approved profile is required', async () => {
  await withSite(async ({ directory, build }) => {
    const source = await readFile(path.join(directory, 'content/profile/main.md'), 'utf8');
    await writeFile(path.join(directory, 'content/profile/another.md'), source);
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /exactly one approved profile/);
  });
});

test('portrait cannot load an image outside approved assets', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/profile/main.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace('../../assets/portrait.png', '../../raw/portrait.png'));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /portrait[\s\S]*approved assets/);
  });
});

test('unapproved profiles cannot publish portrait assets', async () => {
  await withSite(async ({ directory, build }) => {
    const profile = await readFile(path.join(directory, 'content/profile/main.md'), 'utf8');
    const image = await readFile(path.join(directory, 'assets/portrait.png'));
    await writeFile(path.join(directory, 'assets/unapproved-portrait.png'), Buffer.concat([image, Buffer.from('UNAPPROVED_IMAGE_SAMPLE')]));
    await writeFile(path.join(directory, 'content/profile/unapproved.md'), `${profile.replace('approved: true', 'approved: false').replace('assets/portrait.png', 'assets/unapproved-portrait.png')}\n![Unapproved body](../../raw/not-imported.svg)\n`);
    const result = build();
    assert.equal(result.status, 0, log(result));
    const manifest = JSON.parse(await readFile(path.join(directory, 'dist.manifest.json'), 'utf8'));
    assert.equal(Object.keys(manifest.files).some(file => file.includes('unapproved-portrait')), false, JSON.stringify(manifest.files));
    assert.equal((await readdir(path.join(directory, 'dist/_astro'))).some(file => file.includes('unapproved-portrait')), false);
  });
});

test('unused profile Markdown body cannot import raw images', async () => {
  await withSite(async ({ directory, build }) => {
    await mkdir(path.join(directory, 'raw'));
    await writeFile(path.join(directory, 'raw/source.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="13"><rect width="17" height="13" fill="#84938c"/></svg>');
    const file = path.join(directory, 'content/profile/main.md');
    await writeFile(file, `${await readFile(file, 'utf8')}\n![Unused body image](../../raw/source.svg)\n`);
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /profile[\s\S]*body/);
  });
});

test('revoking profile approval removes the previously published image on a cached build', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/profile/main.md');
    const source = await readFile(file, 'utf8');
    const image = await readFile(path.join(directory, 'assets/portrait.png'));
    await writeFile(path.join(directory, 'assets/retired-portrait.png'), Buffer.concat([image, Buffer.from('RETIRED_IMAGE_SAMPLE')]));
    const retired = source.replace('assets/portrait.png', 'assets/retired-portrait.png');
    await writeFile(file, retired);
    const first = build();
    assert.equal(first.status, 0, log(first));
    assert.equal((await readdir(path.join(directory, 'dist/_astro'))).some(name => name.includes('retired-portrait')), true);
    await writeFile(file, retired.replace('approved: true', 'approved: false'));
    await writeFile(path.join(directory, 'content/profile/current.md'), source);
    const second = build();
    assert.equal(second.status, 0, log(second));
    assert.equal((await readdir(path.join(directory, 'dist/_astro'))).some(name => name.includes('retired-portrait')), false);
  });
});

for (const [field, before, after] of [
  ['education', 'degree: {en: Example degree, zh: 示例学位}', 'degree: {en: Example degree}'],
  ['internships', 'role: {en: Example Researcher, zh: 示例研究员}', 'role: {en: Example Researcher}'],
  ['companyHref', 'https://example.org/company', 'javascript:alert(1)'],
  ['advisor', 'https://example.org/advisor', 'javascript:alert(1)'],
]) {
  test(`profile rejects invalid ${field} content`, async () => {
    await withSite(async ({ directory, build }) => {
      const file = path.join(directory, 'content/profile/main.md');
      await writeFile(file, (await readFile(file, 'utf8')).replace(before, after));
      const result = build();
      assert.notEqual(result.status, 0, log(result));
      assert.match(log(result), new RegExp(field));
    });
  });
}

test('omitted education and internships do not create empty homepage sections', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/profile/main.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace(/education:[\s\S]*?(?=contacts:)/, ''));
    const result = build();
    assert.equal(result.status, 0, log(result));
    const html = await readFile(path.join(directory, 'dist/en/index.html'), 'utf8');
    assert.doesNotMatch(html, /id="(?:education|internships)"/);
  });
});

const thesis = `thesis:
  cover: ../../assets/portrait.png
  coverAlt: {en: Synthetic thesis figure, zh: 合成毕业论文图}
  title: {en: Synthetic undergraduate thesis, zh: 合成本科毕业论文}
  summary: {en: A synthetic thesis summary., zh: 合成论文简介。}
  institution: {en: Example University, zh: 示例大学}
  year: 2024
  pdfPath: papers/undergraduate-thesis.pdf
`;

for (const base of ['/', '/preview/']) {
  test(`undergraduate thesis appears within Research with working links on homepages and listings under ${base}`, async () => {
    await withSite(async ({ directory, build }) => {
      const file = path.join(directory, 'content/profile/main.md');
      const original = await readFile(file, 'utf8');
      const featuredFile = path.join(directory, 'content/publications/featured.md');
      await writeFile(featuredFile, (await readFile(featuredFile, 'utf8')).replace('featured: true', 'featured: false'));
      await writeFile(file, original.replace('contacts:', `${thesis}contacts:`));
      await mkdir(path.join(directory, 'public/papers'));
      await writeFile(path.join(directory, 'public/papers/undergraduate-thesis.pdf'), '%PDF-1.4\n%%EOF\n');
      const result = build({ SITE_BASE_PATH: base });
      assert.equal(result.status, 0, log(result));
      for (const [locale, title, label] of [['en', 'Synthetic undergraduate thesis', 'Chinese PDF'], ['zh', '合成本科毕业论文', '中文 PDF']]) {
        for (const route of ['', 'publications/']) {
          const html = await readFile(path.join(directory, `dist/${locale}/${route}index.html`), 'utf8');
          assert.ok(html.includes(title), html);
          assert.ok(html.includes(`href="${base}papers/undergraduate-thesis.pdf"`), html);
          assert.ok(html.includes(label), html);
          assert.match(html, /Undergraduate thesis/);
          assert.match(html, /<article class="publication" id="thesis">[\s\S]*?<img[^>]+alt="(?:Synthetic thesis figure|合成毕业论文图)"/);
          assert.doesNotMatch(html, /<section[^>]+id="thesis"/);
          if (!route) {
            assert.match(html, /<section[^>]+id="research"[^>]*>(?:(?!<\/section>)[\s\S])*id="thesis"/);
            assert.doesNotMatch(html, /Sample Published Paper|Ordinary Preprint/);
          }
        }
      }
      await writeFile(file, original);
      const removed = build({ SITE_BASE_PATH: base });
      assert.equal(removed.status, 0, log(removed));
      for (const locale of ['en', 'zh']) {
        for (const route of ['', 'publications/']) {
          const html = await readFile(path.join(directory, `dist/${locale}/${route}index.html`), 'utf8');
          assert.doesNotMatch(html, /id="thesis"|papers\/undergraduate-thesis\.pdf/);
          if (!route) assert.doesNotMatch(html, /id="research"/);
        }
      }
    });
  });
}

test('an undergraduate thesis with a missing PDF fails the build', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/profile/main.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace('contacts:', `${thesis}contacts:`));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /Missing local target[^\n]*papers\/undergraduate-thesis\.pdf/);
  });
});
