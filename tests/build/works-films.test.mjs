import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

for (const [label, file, before, after, error] of [
  ['local work image', 'works/landscape.md', '../../assets/portrait.png', '/raw/private.jpg', /approved assets/],
  ['bilingual image description', 'works/landscape.md', ', zh: 合成风景', '', /imageAlt/],
  ['hobby icon enum', 'profile/main.md', 'icon: camera', 'icon: arbitrary', /icon/],
  ['film date', 'films/review.md', '2026-10-15', '2026-02-30', /publishedAt/],
  ['film HTML boundary', 'films/review.md', '## 观看记录', '<script>alert(1)</script>', /Raw HTML/],
  ['film URL boundary', 'films/review.md', '/zh/works/', 'javascript:alert(1)', /URL must use/],
]) test(`requires ${label}`, async () => {
  await withSite(async ({ directory, build }) => {
    const target = path.join(directory, 'content', file);
    await writeFile(target, (await readFile(target, 'utf8')).replace(before, after));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), error);
  });
});

test('works and film routes preserve approval, order and subpath links', async () => {
  await withSite(async ({ directory, build }) => {
    const result = build({ SITE_BASE_PATH: '/portfolio/' });
    assert.equal(result.status, 0, log(result));
    const works = await readFile(path.join(directory, 'dist/en/works/index.html'), 'utf8');
    assert.match(works, /Example landscape/);
    assert.match(works, /Synthetic landscape/);
    assert.doesNotMatch(works, /PRIVATE_GALLERY_MARKER|private-missing/);
    const films = await readFile(path.join(directory, 'dist/en/films/index.html'), 'utf8');
    assert.ok(films.indexOf('示例影评') < films.indexOf('Older review'));
    assert.doesNotMatch(films, /PRIVATE_FILM_MARKER/);
    const review = await readFile(path.join(directory, 'dist/en/films/review/index.html'), 'utf8');
    assert.match(review, /lang="zh"/);
    assert.match(review, /href="\/portfolio\/zh\/films\/review\/"/);
    assert.match(review, /href="\/portfolio\/zh\/works\/"/);
    assert.match(review, /合成评论配图/);
  });
});

test('gallery optimization strips photographic EXIF metadata', async () => {
  const { default: sharp } = await import('sharp');
  await withSite(async ({ directory, build }) => {
    const image = path.join(directory, 'assets/photo.jpg');
    await sharp('tests/fixtures/assets/portrait.png').withExif({ IFD0: { ImageDescription: 'SYNTHETIC_LOCATION_METADATA' } }).jpeg().toFile(image);
    assert.ok((await sharp(image).metadata()).exif, 'fixture must contain EXIF');
    const target = path.join(directory, 'content/works/landscape.md');
    await writeFile(target, (await readFile(target, 'utf8')).replace('portrait.png', 'photo.jpg'));
    const result = build();
    assert.equal(result.status, 0, log(result));
    const html = await readFile(path.join(directory, 'dist/en/works/index.html'), 'utf8');
    const source = html.match(/src="([^\"]*photo[^\"]*)"/)[1];
    const output = path.join(directory, 'dist', source);
    assert.equal((await sharp(output).metadata()).exif, undefined);
    assert.equal((await readFile(output)).includes(Buffer.from('SYNTHETIC_LOCATION_METADATA')), false);
  });
});
