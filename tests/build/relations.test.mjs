import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

for (const [field, previous, id] of [
  ['relatedPublications', 'featured', 'missing-paper'],
  ['relatedPublications', 'featured', 'candidate'],
  ['relatedProjects', 'selected', 'missing-project'],
  ['relatedProjects', 'selected', 'candidate'],
]) test(`article rejects ${field} target ${id}`, async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/blog/study-en.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace(`${field}: [${previous}]`, `${field}: [${id}]`));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /study-en/);
    assert.ok(log(result).includes(field));
    assert.ok(log(result).includes(id));
  });
});

test('removing article references removes both forward and reverse links after cached build', async () => {
  await withSite(async ({ directory, build }) => {
    let result = build();
    assert.equal(result.status, 0, log(result));
    let html = await readFile(path.join(directory, 'dist/en/publications/index.html'), 'utf8');
    assert.match(html, /href="\/en\/blog\/sample-study\/"/);
    for (const name of ['study-en.md', 'study-zh.md']) {
      const file = path.join(directory, 'content/blog', name);
      await writeFile(file, (await readFile(file, 'utf8')).replace('relatedPublications: [featured]', 'relatedPublications: []').replace('relatedProjects: [selected]', 'relatedProjects: []'));
    }
    result = build();
    assert.equal(result.status, 0, log(result));
    html = await readFile(path.join(directory, 'dist/en/publications/index.html'), 'utf8');
    assert.doesNotMatch(html, /href="\/en\/blog\/sample-study\/"/);
    html = await readFile(path.join(directory, 'dist/en/blog/sample-study/index.html'), 'utf8');
    assert.doesNotMatch(html, /Related paper:|Related project:/);
  });
});

test('absent optional collections omit homepage sections and keep usable empty lists', async () => {
  await withSite(async ({ directory, build }) => {
    for (const feature of ['publications', 'projects', 'blog']) await rm(path.join(directory, 'content', feature), { recursive: true });
    const result = build();
    assert.equal(result.status, 0, log(result));
    const html = await readFile(path.join(directory, 'dist/en/index.html'), 'utf8');
    assert.doesNotMatch(html, /id="(?:research|projects|blog)"/);
    assert.match(html, /Test Researcher/);
    for (const route of ['publications', 'projects', 'blog']) {
      const listing = await readFile(path.join(directory, 'dist/en', route, 'index.html'), 'utf8');
      assert.match(listing, /class="empty-state"/);
    }
  });
});
