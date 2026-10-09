import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

test('publication Markdown updates the list and approval revocation removes its image', async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/publications/featured.md');
    const source = await readFile(file, 'utf8');
    await writeFile(path.join(directory, 'assets/research-only.png'), Buffer.concat([await readFile(path.join(directory, 'assets/portrait.png')), Buffer.from('RESEARCH_ONLY')]));
    await writeFile(file, source.replace('Sample Published Paper', 'Updated Research Title').replace('assets/portrait.png', 'assets/research-only.png'));
    let result = build();
    assert.equal(result.status, 0, log(result));
    assert.match(await readFile(path.join(directory, 'dist/en/publications/index.html'), 'utf8'), /Updated Research Title/);
    assert.ok((await readdir(path.join(directory, 'dist/_astro'))).some(name => name.includes('research-only')));
    await writeFile(file, source.replace('approved: true', 'approved: false'));
    result = build();
    assert.equal(result.status, 0, log(result));
    assert.doesNotMatch(await readFile(path.join(directory, 'dist/en/publications/index.html'), 'utf8'), /Updated Research Title|Sample Published Paper/);
    assert.ok(!(await readdir(path.join(directory, 'dist/_astro'))).some(name => name.includes('research-only')));
  });
});

for (const [label, before, after, error] of [
  ['bilingual summary', '  zh: 示例研究贡献\n', '', /summary[\s\S]*zh/],
  ['safe URL', 'https://example.org/paper', 'javascript:alert(1)', /paperUrl/],
  ['image alternative', '  zh: 示例研究图\n', '', /coverAlt/],
]) test(`publication requires ${label}`, async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/publications/featured.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace(before, after));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), error);
  });
});
