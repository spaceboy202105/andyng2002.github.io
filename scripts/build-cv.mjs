import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm, rename, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readSiteConfig } from './site-config.mjs';
import { cvLocales, cvSources, sha256 } from './cv-files.mjs';

const settings = readSiteConfig();
const inside = (directory, file) => {
  const relative = path.relative(directory, file);
  return !relative || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

async function validatePath(file, directory = false) {
  const root = await realpath(process.cwd());
  if (!inside(root, file) || file === root) throw new Error(`CV path must stay inside the project: ${file}`);
  let current = root;
  for (const part of path.relative(root, file).split(path.sep)) {
    current = path.join(current, part);
    let stat;
    try { stat = await lstat(current); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isSymbolicLink() || ((current !== file || directory) ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error(`CV path must be a regular ${directory ? 'directory' : 'file'} without symbolic links: ${current}`);
    }
  }
}

let stage;
const installed = [];
const backups = [];
let committed = false;
let rolledBack = false;
try {
  if (inside(settings.cvSourceDir, settings.publicDir) || inside(settings.publicDir, settings.cvSourceDir)) {
    throw new Error('CV source and public directories must be distinct and must not overlap');
  }
  const targets = cvLocales.map(locale => [`${locale}.pdf`, path.join(settings.publicDir, 'cv', `${locale}.pdf`)]);
  targets.push(['manifest.json', settings.cvManifestPath]);
  await validatePath(settings.cvSourceDir, true);
  await validatePath(path.join(settings.publicDir, 'cv'), true);
  for (const [, target] of targets) await validatePath(target);
  const sources = cvSources(settings.cvSourceDir);
  if (!sources['zh.tex'] || !sources['en.tex']) throw new Error('Both zh.tex and en.tex are required');
  await mkdir(settings.publicDir, { recursive: true });
  stage = await mkdtemp(path.join(settings.publicDir, '.cv-stage-'));
  for (const file of Object.keys(sources)) {
    await mkdir(path.dirname(path.join(stage, file)), { recursive: true });
    await copyFile(path.join(settings.cvSourceDir, file), path.join(stage, file));
  }
  // shortcut: native font reads can bypass the TeX recorder; use an OS sandbox before accepting untrusted TeX.
  const texEnv = {
    PATH: process.env.PATH,
    HOME: stage,
    TMPDIR: stage,
    LANG: 'en_US.UTF-8',
    TEXMFHOME: path.join(stage, 'texmf'),
    TEXMFCONFIG: path.join(stage, 'texmf-config'),
    TEXMFVAR: path.join(stage, 'texmf-var'),
    TEXINPUTS: '.:',
    openin_any: 'p',
    openout_any: 'p',
  };
  const trustedRoots = [];
  for (const variable of ['TEXMFROOT', 'TEXMFDIST', 'TEXMFSYSVAR', 'TEXMFSYSCONFIG']) {
    const result = spawnSync('kpsewhich', [`-var-value=${variable}`], { env: texEnv, encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error(`TeX distribution lookup failed: ${result.error?.message ?? result.stderr}`);
    trustedRoots.push(result.stdout.trim());
  }
  // Debian packages also install TeX inputs outside TEXMFDIST.
  trustedRoots.push('/usr/share/texmf', '/System/Library/Fonts', '/Library/Fonts', '/usr/share/fonts', '/usr/local/share/fonts');
  const trusted = [];
  for (const directory of trustedRoots) {
    if (!path.isAbsolute(directory)) throw new Error(`Invalid TeX distribution directory: ${directory}`);
    try { trusted.push(await realpath(directory)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const approved = new Set(Object.keys(sources).map(file => path.join(stage, file)));
  const pdfs = {};
  for (const locale of cvLocales) {
    const result = spawnSync('latexmk', ['-norc', '-recorder', '-xelatex', '-halt-on-error', '-interaction=nonstopmode', '-no-shell-escape', `${locale}.tex`], { cwd: stage, env: texEnv, encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error(`CV ${locale} compilation failed: ${result.error?.message ?? result.stdout + result.stderr}`);
    const recorder = await readFile(path.join(stage, `${locale}.fls`), 'utf8');
    const generated = new Set([`${locale}.aux`, `${locale}.out`].map(file => path.join(stage, file)));
    let inputs = 0;
    for (const line of recorder.split('\n')) {
      if (!line.startsWith('INPUT ')) continue;
      inputs++;
      const file = await realpath(path.resolve(stage, line.slice(6)));
      if (!approved.has(file) && !generated.has(file) && !trusted.some(directory => inside(directory, file))) {
        throw new Error(`Unapproved CV TeX input: ${file}`);
      }
    }
    if (!inputs) throw new Error(`Missing CV TeX input records: ${locale}`);
    const bytes = await readFile(path.join(stage, `${locale}.pdf`));
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`Invalid PDF: ${locale}`);
    pdfs[locale] = sha256(bytes);
  }
  if (JSON.stringify(sources) !== JSON.stringify(cvSources(settings.cvSourceDir))) throw new Error('CV sources changed during compilation');
  await writeFile(path.join(stage, 'manifest.json'), `${JSON.stringify({ version: 1, sources, pdfs }, null, 2)}\n`);
  await mkdir(path.join(settings.publicDir, 'cv'), { recursive: true });
  await validatePath(path.join(settings.publicDir, 'cv'), true);
  for (const [, target] of targets) await validatePath(target);
  for (const [source, target] of targets) {
    const backup = path.join(stage, `backup-${backups.length}`);
    try { await rename(target, backup); backups.push([backup, target]); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await rename(path.join(stage, source), target);
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
