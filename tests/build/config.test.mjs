import test from 'node:test';
import assert from 'node:assert/strict';
import { rename, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

test('raw directories cannot be selected as site inputs', async () => {
  await withSite(async ({ directory, build }) => {
    await rename(path.join(directory, 'content'), path.join(directory, 'raw'));
    const result = build({ SITE_CONTENT_DIR: path.join(directory, 'raw') });
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /SITE_CONTENT_DIR[\s\S]*raw/);
  });
});

test('public input rejects unknown files even when no page links to them', async () => {
  await withSite(async ({ directory, build }) => {
    await writeFile(path.join(directory, 'public/source-reference.txt'), 'SYNTHETIC_PRIVATE_SOURCE');
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /source-reference\.txt/);
  });
});

test('raw directories cannot receive build outputs', async () => {
  await withSite(async ({ directory, build }) => {
    const result = build({ SITE_OUTPUT_DIR: path.join(directory, 'raw') });
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /SITE_OUTPUT_DIR[\s\S]*raw/);
  });
});

test('build output cannot overwrite its content input', async () => {
  await withSite(async ({ directory, build }) => {
    const result = build({ SITE_OUTPUT_DIR: path.join(directory, 'content') });
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /SITE_OUTPUT_DIR overlaps/);
  });
});

test('a protocol-relative base path cannot escape the site origin', async () => {
  await withSite(async ({ build }) => {
    const result = build({ SITE_BASE_PATH: '//' });
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /SITE_BASE_PATH/);
  });
});

test('an assets directory cannot follow a symbolic link to another source', async () => {
  await withSite(async ({ directory, build }) => {
    await rename(path.join(directory, 'assets'), path.join(directory, 'other-source'));
    await symlink('other-source', path.join(directory, 'assets'));
    const result = build();
    assert.notEqual(result.status, 0, log(result));
    assert.match(log(result), /Symbolic links/);
  });
});
