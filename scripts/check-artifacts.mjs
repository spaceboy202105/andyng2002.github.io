import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { checkLocalLinks } from './check-links.mjs';
import { checkCv } from './cv-files.mjs';
import { readSiteConfig } from './site-config.mjs';

async function listFiles(directory, prefix = '') {
  let entries;
  try {
    if ((await lstat(directory)).isSymbolicLink()) throw new Error(`Symbolic links are not public inputs: ${directory}`);
    entries = await readdir(directory, { withFileTypes: true });
  }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not public inputs: ${relative}`);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), `${relative}/`));
    else files.push(relative);
  }
  return files.sort();
}

export async function checkInputs(settings) {
  const allowed = JSON.parse(await readFile(new URL('./public-files.json', import.meta.url), 'utf8'));
  if (!Array.isArray(allowed) || allowed.some(file => typeof file !== 'string' || file.startsWith('/') || file.split('/').includes('..'))) throw new Error('public-files.json must list explicit relative filenames');
  for (const file of await listFiles(settings.publicDir)) {
    if (!allowed.includes(file)) throw new Error(`Unapproved public file: ${file}`);
  }
  await listFiles(settings.contentDir);
  await listFiles(path.resolve(settings.contentDir, '../assets'));
}

async function outputFiles(settings, errors) {
  const files = {};
  for (const file of await listFiles(settings.outDir)) {
    if (/(^|\/)(raw|tests|fixtures|playwright-report|test-results)(\/|$)|cv-source|sanitized/i.test(file)) errors.push(`Forbidden output file: ${file}`);
    const contents = await readFile(path.join(settings.outDir, file));
    if (contents.includes(Buffer.from('SYNTHETIC_PRIVATE_SOURCE'))) errors.push(`Private source marker in output: ${file}`);
    if (settings.contentDir === path.resolve('src/content') && /\.html$/.test(file) && /Test Researcher|测试研究者|Synthetic biography/.test(contents.toString())) errors.push(`Fixture content in formal output: ${file}`);
    files[file] = createHash('sha256').update(contents).digest('hex');
  }
  return files;
}

const formalSite = 'https://spaceboy202105.github.io';
const formalBase = '/andyng2002.github.io/';

export async function recordArtifacts(settings) {
  const errors = [];
  const files = await outputFiles(settings, errors);
  errors.push(...await checkLocalLinks(settings, files));
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(settings.manifestPath, `${JSON.stringify({ contentDir: settings.contentDir, publicDir: settings.publicDir, site: settings.site, base: settings.base, files }, null, 2)}\n`);
}

export async function checkArtifacts(settings, { release = false, env = process.env } = {}) {
  const errors = [];
  let actual = {};
  try { actual = await outputFiles(settings, errors); }
  catch (error) { errors.push(error.message); }
  if (release) {
    if (env.SITE_URL !== formalSite) errors.push(`SITE_URL must explicitly equal ${formalSite}`);
    if (env.SITE_BASE_PATH !== formalBase) errors.push(`SITE_BASE_PATH must explicitly equal ${formalBase}`);
    for (const [key, directory, label] of [['contentDir', 'src/content', 'content'], ['publicDir', 'public', 'public'], ['cvSourceDir', 'cv', 'CV source']]) {
      if (settings[key] !== path.resolve(directory)) errors.push(`Release requires formal ${label} inputs: ${directory}`);
    }
  }
  try { await checkInputs(settings); }
  catch (error) { errors.push(error.message); }
  try {
    const cv = checkCv(settings, settings.outDir);
    if (release && (!cv.zh || !cv.en)) errors.push('Release requires both verified CV PDFs');
  } catch (error) { errors.push(error.message); }
  try {
    const manifest = JSON.parse(await readFile(settings.manifestPath, 'utf8'));
    if (manifest.contentDir !== settings.contentDir || manifest.publicDir !== settings.publicDir || manifest.site !== settings.site || manifest.base !== settings.base) errors.push('Build inputs or deployment settings differ from the artifact manifest; rebuild first');
    for (const file of new Set([...Object.keys(actual), ...Object.keys(manifest.files)])) {
      if (actual[file] !== manifest.files[file]) errors.push(`Output differs from the verified build: ${file}`);
    }
  } catch (error) { errors.push(`Artifact manifest: ${error.message}`); }
  if (!actual['index.html'] || !actual['en/index.html'] || !actual['zh/index.html'] || !actual['404.html']) errors.push('Required homepage or 404 output is missing');
  try { errors.push(...await checkLocalLinks(settings, actual)); }
  catch (error) { errors.push(error.message); }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Checked ${Object.keys(actual).length} output files, local links, CV hashes and the public-file allowlist${release ? '; release requirements passed' : ''}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const release = process.argv.includes('--release');
  try {
    const settings = readSiteConfig(release ? { ...process.env, SITE_URL: formalSite, SITE_BASE_PATH: formalBase } : process.env);
    await checkArtifacts(settings, { release });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
