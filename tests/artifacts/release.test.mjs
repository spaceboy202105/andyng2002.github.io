import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { withSite, log } from '../build/helpers.mjs';

test('release reports forbidden output, unknown files, input and deployment violations together', async () => {
  await withSite(async ({ directory, build, env }) => {
    const built = build();
    assert.equal(built.status, 0, log(built));
    await mkdir(`${directory}/dist/raw`);
    await writeFile(`${directory}/dist/raw/cv-source-sanitized.pdf`, 'SYNTHETIC_PRIVATE_SOURCE');
    await writeFile(`${directory}/dist/unknown.txt`, 'unlinked');
    const releaseEnv = { ...env };
    delete releaseEnv.SITE_URL;
    delete releaseEnv.SITE_BASE_PATH;
    const result = spawnSync(process.execPath, ['scripts/check-artifacts.mjs', '--release'], { env: releaseEnv, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    for (const pattern of [/Forbidden output/, /Private source marker/, /unknown.txt/, /SITE_URL/, /SITE_BASE_PATH/, /formal content/, /formal public/, /CV/]) assert.match(log(result), pattern);
  });
});

for (const target of ['/en/blog/missing/', '/en/blog/candidate/', '/en/projects/#missing-anchor', '#missing-heading']) {
  test(`built Markdown rejects unavailable local target ${target}`, async () => {
    await withSite(async ({ directory, build }) => {
      await appendFile(path.join(directory, 'content/blog/study-en.md'), `\n[Unavailable](${target})\n`);
      const result = build({ SITE_BASE_PATH: '/preview/' });
      assert.notEqual(result.status, 0, 'unavailable Markdown destination must fail the actual build');
      assert.match(log(result), /Missing local (target|anchor)/);
    });
  });
}

test('release rejects incorrect or malformed deployment values without hiding output violations', async () => {
  await withSite(async ({ directory, build, env }) => {
    const built = build();
    assert.equal(built.status, 0, log(built));
    await writeFile(`${directory}/dist/private.txt`, 'SYNTHETIC_PRIVATE_SOURCE');
    for (const override of [
      { SITE_URL: 'https://example.org', SITE_BASE_PATH: '/' },
      { SITE_URL: 'not a URL', SITE_BASE_PATH: '/../' },
    ]) {
      const result = spawnSync(process.execPath, ['scripts/check-artifacts.mjs', '--release'], { env: { ...env, ...override }, encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      for (const pattern of [/SITE_URL/, /SITE_BASE_PATH/, /Private source marker/, /formal content/, /CV/]) assert.match(log(result), pattern);
    }
  });
});

test('release reports stale CV source and missing build manifest', async () => {
  const { cp, rm } = await import('node:fs/promises');
  await withSite(async ({ directory, build, env }) => {
    const built = build();
    assert.equal(built.status, 0, log(built));
    await cp('cv', `${directory}/cv`, { recursive: true });
    await appendFile(`${directory}/cv/style.tex`, '\n% synthetic stale source\n');
    await rm(`${directory}/dist.manifest.json`);
    const result = spawnSync(process.execPath, ['scripts/check-artifacts.mjs', '--release'], { env: { ...env, CV_SOURCE_DIR: `${directory}/cv`, SITE_URL: 'https://spaceboy202105.github.io', SITE_BASE_PATH: '/andyng2002.github.io/' }, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(log(result), /Stale CV source: style.tex/);
    assert.match(log(result), /Artifact manifest/);
    assert.match(log(result), /formal CV source/);
  });
});

test('an unapproved story cannot be reached through a hand-written Markdown link', async () => {
  await withSite(async ({ directory, build }) => {
    await writeFile(`${directory}/content/blog/hidden-en.md`, '---\napproved: false\nstoryId: hidden\nlang: en\n---\nNot public.\n');
    await appendFile(`${directory}/content/blog/study-en.md`, '\n[Hidden story](/en/blog/hidden/)\n');
    const result = build();
    assert.notEqual(result.status, 0);
    assert.match(log(result), /Missing local target.*hidden/);
  });
});

test('HTML parser verifies href, src, srcset and decoded anchors under a base path', async () => {
  const { checkLocalLinks } = await import('../../scripts/check-links.mjs');
  await withSite(async ({ directory }) => {
    const outDir = `${directory}/dist`;
    await mkdir(`${outDir}/en`, { recursive: true });
    await writeFile(`${outDir}/en/index.html`, '<h1 id="中文">Heading</h1><a href="#%E4%B8%AD%E6%96%87">Valid</a><img src="/preview/photo.png" srcset="/preview/photo.png 1x, /preview/absent.png 2x"><a href="/en/">Wrong base</a><a href="/preview/en/#absent">Missing anchor</a><img src="/preview/missing.png">');
    const errors = await checkLocalLinks({ site: 'https://example.org', base: '/preview/', outDir }, { 'en/index.html': '', 'photo.png': '' });
    assert.equal(errors.length, 4, errors.join('\n'));
    for (const name of ['absent.png', 'missing.png', '#absent', 'escapes deployment base']) assert.ok(errors.some(error => error.includes(name)), name);
  });
});
