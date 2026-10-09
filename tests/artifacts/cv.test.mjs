import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('CV compilation preserves the previous pair and manifest on invalid second input', async () => {
  const dir = await mkdtemp(path.resolve('.test-work-cv-'));
  const env = { ...process.env, CV_SOURCE_DIR: `${dir}/source`, SITE_PUBLIC_DIR: `${dir}/public` };
  const build = () => spawnSync(process.execPath, ['scripts/build-cv.mjs'], { env, encoding: 'utf8' });
  try {
    await cp('tests/fixtures/cv', `${dir}/source`, { recursive: true });
    let result = build();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const files = [`${dir}/public/cv/zh.pdf`, `${dir}/public/cv/en.pdf`, `${dir}/source/manifest.json`];
    const before = await Promise.all(files.map(file => readFile(file)));
    const unavailable = spawnSync(process.execPath, ['scripts/build-cv.mjs'], { env: { ...env, PATH: '/nonexistent-tex-tools' }, encoding: 'utf8' });
    assert.notEqual(unavailable.status, 0);
    assert.match(unavailable.stderr, /ENOENT/);
    assert.deepEqual(await Promise.all(files.map(file => readFile(file))), before);
    await writeFile(`${dir}/source/en.tex`, '\\undefinedcommand');
    result = build();
    assert.notEqual(result.status, 0);
    assert.deepEqual(await Promise.all(files.map(file => readFile(file))), before);
    await rm(`${dir}/source/en.tex`);
    assert.notEqual(build().status, 0);
    assert.deepEqual(await Promise.all(files.map(file => readFile(file))), before);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('source changes and damaged PDFs fail CV artifact verification; a missing locale stays independent', async () => {
  const { checkCv } = await import('../../scripts/cv-files.mjs');
  const dir = await mkdtemp(path.resolve('.test-work-cv-'));
  const settings = { cvSourceDir: `${dir}/source`, cvManifestPath: `${dir}/source/manifest.json`, publicDir: `${dir}/public` };
  try {
    await cp('tests/fixtures/cv', settings.cvSourceDir, { recursive: true });
    await cp('cv/style.tex', `${settings.cvSourceDir}/style.tex`);
    const result = spawnSync(process.execPath, ['scripts/build-cv.mjs'], { env: { ...process.env, CV_SOURCE_DIR: settings.cvSourceDir, SITE_PUBLIC_DIR: settings.publicDir }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(checkCv(settings), { zh: true, en: true });
    for (const locale of ['zh', 'en']) {
      const text = spawnSync('pdftotext', [`${settings.publicDir}/cv/${locale}.pdf`, '-'], { encoding: 'utf8' });
      assert.equal(text.status, 0, text.stderr);
      assert.match(text.stdout, /中文测试/);
      assert.match(text.stdout, /100%/);
      assert.match(text.stdout, /under_score/);
      assert.match(text.stdout, /final_part\?value=100/);
    }
    await rm(`${settings.publicDir}/cv/en.pdf`);
    assert.deepEqual(checkCv(settings), { zh: true });
    await writeFile(`${settings.publicDir}/cv/en.pdf`, '%PDF-damaged');
    assert.throws(() => checkCv(settings), /hash mismatch: en/);
    await writeFile(`${settings.cvSourceDir}/style.tex`, '% stale source');
    assert.throws(() => checkCv(settings), /Stale CV source: style.tex/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
