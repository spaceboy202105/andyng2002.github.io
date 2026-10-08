import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from '../build/helpers.mjs';

test('artifact check rejects an unlinked file in the output directory', async () => {
  await withSite(async ({ directory, build, command }) => {
    const result = build();
    assert.equal(result.status, 0, log(result));
    assert.equal(command('scripts/check-artifacts.mjs').status, 0);
    await writeFile(path.join(directory, 'dist/private-source.txt'), 'Unlinked draft file');
    const checked = command('scripts/check-artifacts.mjs');
    assert.notEqual(checked.status, 0, log(checked));
    assert.match(log(checked), /private-source\.txt/);
  });
});
