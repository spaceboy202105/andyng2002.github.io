import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readSiteConfig } from './site-config.mjs';
import { cvLocales, cvSources, sha256 } from './cv-files.mjs';

const settings = readSiteConfig();
let stage;
const installed = [];
const backups = [];
let committed = false;
let rolledBack = false;
try {
  const sources = cvSources(settings.cvSourceDir);
  if (!sources['zh.tex'] || !sources['en.tex']) throw new Error('Both zh.tex and en.tex are required');
  await mkdir(settings.publicDir, { recursive: true });
  stage = await mkdtemp(path.join(settings.publicDir, '.cv-stage-'));
  for (const file of Object.keys(sources)) {
    await mkdir(path.dirname(path.join(stage, file)), { recursive: true });
    await copyFile(path.join(settings.cvSourceDir, file), path.join(stage, file));
  }
  const pdfs = {};
  for (const locale of cvLocales) {
    const result = spawnSync('latexmk', ['-xelatex', '-halt-on-error', '-interaction=nonstopmode', '-no-shell-escape', `${locale}.tex`], { cwd: stage, encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error(`CV ${locale} compilation failed: ${result.error?.message ?? result.stdout + result.stderr}`);
    const bytes = await readFile(path.join(stage, `${locale}.pdf`));
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`Invalid PDF: ${locale}`);
    pdfs[locale] = sha256(bytes);
  }
  if (JSON.stringify(sources) !== JSON.stringify(cvSources(settings.cvSourceDir))) throw new Error('CV sources changed during compilation');
  await writeFile(path.join(stage, 'manifest.json'), `${JSON.stringify({ version: 1, sources, pdfs }, null, 2)}\n`);
  await mkdir(path.join(settings.publicDir, 'cv'), { recursive: true });
  const targets = cvLocales.map(locale => [path.join(stage, `${locale}.pdf`), path.join(settings.publicDir, 'cv', `${locale}.pdf`)]);
  targets.push([path.join(stage, 'manifest.json'), settings.cvManifestPath]);
  for (const [source, target] of targets) {
    const backup = path.join(stage, `backup-${backups.length}`);
    try { await rename(target, backup); backups.push([backup, target]); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await rename(source, target);
    installed.push(target);
  }
  committed = true;
  console.log('Built Chinese and English CV PDFs and source manifest.');
} catch (error) {
  if (committed) throw error;
  for (const target of installed.reverse()) await rm(target, { force: true });
  for (const [backup, target] of backups.reverse()) await rename(backup, target);
  rolledBack = true;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (stage && (committed || rolledBack || !backups.length)) await rm(stage, { recursive: true, force: true });
  else if (stage) console.error(`CV rollback incomplete; backups retained in ${stage}`);
}
