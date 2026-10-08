import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { withSite, log } from './helpers.mjs';

test('subdirectory build prefixes home, language, image and 404 addresses', async () => {
  await withSite(async ({ directory, build }) => {
    const result = build({ SITE_BASE_PATH: '/preview/' });
    assert.equal(result.status, 0, log(result));
    const home = await readFile(path.join(directory, 'dist/en/index.html'), 'utf8');
    assert.match(home, /href="\/preview\/en\/"/);
    assert.match(home, /href="\/preview\/zh\/"/);
    assert.match(home, /src="\/preview\/_astro\/[^\"]+\.webp"/);
    const missing = await readFile(path.join(directory, 'dist/404.html'), 'utf8');
    assert.match(missing, /href="\/preview\/en\/"/);
    assert.match(missing, /href="\/preview\/zh\/"/);
    const root = await readFile(path.join(directory, 'dist/index.html'), 'utf8');
    assert.match(root, /data-default-entry/);
    assert.match(root, /data-en-home="\/preview\/en\/"/);
  });
});
