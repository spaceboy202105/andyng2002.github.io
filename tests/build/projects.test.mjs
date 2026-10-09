import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

for (const [label, before, after, error] of [
  ['bilingual role', ', zh: 设计并实现工具', '', /role[\s\S]*zh/],
  ['safe URL', 'https://example.org/code', 'data:text/html,unsafe', /codeUrl/],
  ['existing screenshot', 'assets/portrait.png', 'assets/missing.png', /missing\.png/],
  ['real date', '2025-04-03', '2025-02-30', /date/],
]) test(`project requires ${label}`, async () => {
  await withSite(async ({ directory, build }) => {
    const file = path.join(directory, 'content/projects/selected.md');
    await writeFile(file, (await readFile(file, 'utf8')).replace(before, after));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), error);
  });
});

test('new approved project appears before undated work', async () => {
  await withSite(async ({ directory, build }) => {
    const source = await readFile(path.join(directory, 'content/projects/selected.md'), 'utf8');
    await writeFile(path.join(directory, 'content/projects/new-project.md'), source.replace('Selected Project', 'New Project').replace('2025-04-03', '2026-04-03'));
    const result = build();
    assert.equal(result.status, 0, log(result));
    const html = await readFile(path.join(directory, 'dist/en/projects/index.html'), 'utf8');
    assert.ok(html.indexOf('New Project') < html.indexOf('Selected Project'));
    assert.ok(html.indexOf('Selected Project') < html.indexOf('Ordinary Project'));
    assert.doesNotMatch(html, /Unselected Project/);
  });
});
