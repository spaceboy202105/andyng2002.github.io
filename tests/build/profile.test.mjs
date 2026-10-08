import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
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
