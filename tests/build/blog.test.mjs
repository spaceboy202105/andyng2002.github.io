import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

for (const [label, before, after, error] of [
  ['real date', '2026-04-02', '2026-02-30', /publishedAt/],
  ['ordered update date', '2026-04-04', '2025-01-01', /updatedAt/],
  ['stable story ID', 'storyId: sample-study', 'storyId: ../private', /storyId/],
  ['consistent original language', 'originalLang: zh', 'originalLang: en', /originalLang/],
  ['consistent publication date', '2026-04-02', '2026-04-03', /publishedAt/],
]) test(`Blog requires ${label}`, async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/blog/study-en.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace(before, after));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /blog/);
    assert.match(log(result), error);
  });
});

for (const [label, body] of [
  ['script HTML', '<script>alert(1)</script>'],
  ['event HTML', '<img src="x" onerror="alert(1)">'],
  ['javascript URL', '[unsafe](javascript:alert%281%29)'],
  ['encoded protocol', '[unsafe](javascript%3Aalert%281%29)'],
  ['data image', '![unsafe](data:image/svg+xml,unsafe)'],
  ['reference URL', '[unsafe][target]\n\n[target]: javascript:alert(1)'],
  ['network path', '[unsafe](//evil.example/path)'],
  ['page image reference', '![unsafe][target]\n\n[target]: /en/projects/'],
  ['anchor image reference', '![unsafe][target]\n\n[target]: #results'],
  ['relative asset link', '[unsafe](../../assets/portrait.png)'],
  ['relative asset reference link', '[unsafe][target]\n\n[target]: ../../assets/portrait.png'],
  ['raw path', '![unsafe](../../raw/private.png)'],
  ['encoded traversal', '[unsafe](/en/%2e%2e/raw/)'],
  ['unapproved public resource', '![unsafe](/unknown.png)'],
]) test(`Blog rejects ${label} before rendering`, async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/blog/study-en.md');
    await writeFile(file, `${await readFile(file, 'utf8')}\n${body}\n`);
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /blog\/study-en.md/);
    assert.match(log(result), /HTML|URL/);
  });
});

test('Blog rejects duplicate language versions and missing approved original', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/blog/study-en.md');
    await writeFile(path.join(directory, 'content/blog/duplicate.md'), await readFile(file, 'utf8'));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /duplicate storyId\/lang/);
  });
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/blog/study-zh.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace('approved: true', 'approved: false'));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /sample-study[\s\S]*originalLang/);
  });
});

test('Blog changes body on cached build and rewrites local links and images for a base path', async () => {
  await withSite(async ({ directory, build }) => {
    const overrides = { SITE_BASE_PATH: '/preview/' };
    let result = build(overrides);
    assert.equal(result.status, 0, log(result));
    const file = path.join(directory, 'content/blog/study-en.md');
    await writeFile(file, `${await readFile(file, 'utf8')}\nFresh body after a content edit.\n\n![Reference diagram][figure]\n\n[figure]: ../../assets/portrait.png\n`);
    result = build(overrides);
    assert.equal(result.status, 0, log(result));
    const html = await readFile(path.join(directory, 'dist/en/blog/sample-study/index.html'), 'utf8');
    assert.match(html, /Fresh body after a content edit\./);
    assert.match(html, /alt="Reference diagram"/);
    assert.match(html, /href="\/preview\/en\/projects\/"/);
    assert.match(html, /src="\/preview\/_astro\//);
    assert.match(html, /href="#results"/);
    assert.doesNotMatch(html, /Unapproved translation/);
    assert.ok(!(await readdir(path.join(directory, 'dist/_astro'))).some(name => name.includes('not-imported')));
  });
});

test('approved Blog requires a non-empty body', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/blog/study-en.md');
    const source = await readFile(file, 'utf8');
    await writeFile(file, `${source.split('\n---\n')[0]}\n---\n\n  `);
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /blog\/study-en.md[\s\S]*body/);
  });
});
