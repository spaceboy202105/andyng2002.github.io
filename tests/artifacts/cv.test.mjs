import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm, mkdir, symlink, rename } from 'node:fs/promises';
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
      assert.match(text.stdout.replace(/\s+/g, ''), /final_part\?value=100/);
      const links = spawnSync('pdfinfo', ['-url', `${settings.publicDir}/cv/${locale}.pdf`], { encoding: 'utf8' });
      assert.equal(links.status, 0, links.stderr);
      assert.ok(links.stdout.split(/\s+/).includes('https://example.com/synthetic_fixture/very_long_segment_for_line_wrapping/another_long_segment_to_verify_readable_links/final_part?value=100'));
    }
    await rm(`${settings.publicDir}/cv/en.pdf`);
    assert.deepEqual(checkCv(settings), { zh: true });
    await writeFile(`${settings.publicDir}/cv/en.pdf`, '%PDF-damaged');
    assert.throws(() => checkCv(settings), /hash mismatch: en/);
    await writeFile(`${settings.cvSourceDir}/style.tex`, '% stale source');
    assert.throws(() => checkCv(settings), /Stale CV source: style.tex/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('CV rejects unsafe destinations and unapproved TeX inputs without changing existing files', async () => {
  const dir = await mkdtemp(path.resolve('.test-work-cv-boundary-'));
  const env = { ...process.env, CV_SOURCE_DIR: `${dir}/source`, SITE_PUBLIC_DIR: `${dir}/public` };
  const build = () => spawnSync(process.execPath, ['scripts/build-cv.mjs'], { env, encoding: 'utf8' });
  try {
    await cp('tests/fixtures/cv', `${dir}/source`, { recursive: true });
    let result = build();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const files = [`${dir}/public/cv/zh.pdf`, `${dir}/public/cv/en.pdf`, `${dir}/source/manifest.json`];
    const before = await Promise.all(files.map(file => readFile(file)));
    await rename(`${dir}/public/cv`, `${dir}/saved-cv`);
    await mkdir(`${dir}/outside`);
    await writeFile(`${dir}/outside/keep.txt`, 'synthetic outside sentinel');
    await symlink(`${dir}/outside`, `${dir}/public/cv`);
    result = build();
    assert.notEqual(result.status, 0, 'a symbolic-link CV directory must be rejected');
    assert.equal(await readFile(`${dir}/outside/keep.txt`, 'utf8'), 'synthetic outside sentinel');
    await assert.rejects(readFile(`${dir}/outside/en.pdf`), { code: 'ENOENT' });
    await rm(`${dir}/public/cv`);
    await rename(`${dir}/saved-cv`, `${dir}/public/cv`);
    assert.deepEqual(await Promise.all(files.map(file => readFile(file))), before);

    await rename(files[1], `${dir}/saved-en.pdf`);
    await mkdir(files[1]);
    await writeFile(`${files[1]}/keep.txt`, 'synthetic directory sentinel');
    result = build();
    assert.notEqual(result.status, 0, 'an existing target directory must be rejected');
    assert.equal(await readFile(`${files[1]}/keep.txt`, 'utf8'), 'synthetic directory sentinel');
    assert.deepEqual(await readFile(files[0]), before[0]);
    assert.deepEqual(await readFile(files[2]), before[2]);
    await rm(files[1], { recursive: true });
    await rename(`${dir}/saved-en.pdf`, files[1]);

    await writeFile(`${dir}/private.tex`, 'SYNTHETIC-UNAPPROVED-INPUT');
    const en = await readFile(`${dir}/source/en.tex`, 'utf8');
    for (const input of [`${dir}/private.tex`, '../../private.tex']) {
      await writeFile(`${dir}/source/en.tex`, en.replace('\\end{document}', `\\input{${input}}\n\\end{document}`));
      result = build();
      assert.notEqual(result.status, 0, `unapproved TeX input must be rejected: ${input}`);
      assert.deepEqual(await Promise.all(files.map(file => readFile(file))), before);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('CV rolls back a failure after the first PDF has actually been replaced', async () => {
  const dir = await mkdtemp(path.resolve('.test-work-cv-rollback-'));
  const env = { ...process.env, CV_SOURCE_DIR: `${dir}/source`, SITE_PUBLIC_DIR: `${dir}/public` };
  try {
    await cp('tests/fixtures/cv', `${dir}/source`, { recursive: true });
    let result = spawnSync(process.execPath, ['scripts/build-cv.mjs'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const files = [`${dir}/public/cv/zh.pdf`, `${dir}/public/cv/en.pdf`, `${dir}/source/manifest.json`];
    const before = await Promise.all(files.map(file => readFile(file)));
    const zh = await readFile(`${dir}/source/zh.tex`, 'utf8');
    await writeFile(`${dir}/source/zh.tex`, zh.replace('Synthetic CV fixture.', 'Synthetic replacement CV fixture.'));
    await writeFile(`${dir}/fail-rename.mjs`, `
      import fs from 'node:fs/promises';
      import { syncBuiltinESMExports } from 'node:module';
      import assert from 'node:assert/strict';
      const oldPdf = await fs.readFile(${JSON.stringify(files[0])});
      const rename = fs.rename;
      fs.rename = async (source, target) => {
        if (source.includes('/.cv-stage-') && source.endsWith('/en.pdf')) {
          assert.notDeepEqual(await fs.readFile(${JSON.stringify(files[0])}), oldPdf);
          console.error('Observed first PDF replacement; injecting second replacement failure');
          throw new Error('Synthetic rename failure');
        }
        return rename(source, target);
      };
      syncBuiltinESMExports();
    `);
    result = spawnSync(process.execPath, ['--import', `${dir}/fail-rename.mjs`, 'scripts/build-cv.mjs'], { env, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Observed first PDF replacement/);
    assert.match(result.stderr, /Synthetic rename failure/);
    assert.deepEqual(await Promise.all(files.map(file => readFile(file))), before);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
