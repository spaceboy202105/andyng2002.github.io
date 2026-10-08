import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
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

async function outputFiles(settings) {
  const files = {};
  for (const file of await listFiles(settings.outDir)) {
    if (/(^|\/)(raw|tests|fixtures)(\/|$)|cv-source|sanitized/i.test(file)) throw new Error(`Forbidden output file: ${file}`);
    const contents = await readFile(path.join(settings.outDir, file));
    if (contents.includes(Buffer.from('SYNTHETIC_PRIVATE_SOURCE'))) throw new Error(`Private source marker in output: ${file}`);
    if (settings.contentDir === path.resolve('src/content') && /\.html$/.test(file) && /Test Researcher|测试研究者|Synthetic biography/.test(contents.toString())) throw new Error(`Fixture content in formal output: ${file}`);
    files[file] = createHash('sha256').update(contents).digest('hex');
  }
  return files;
}

export async function recordArtifacts(settings) {
  const files = await outputFiles(settings);
  await writeFile(settings.manifestPath, `${JSON.stringify({ contentDir: settings.contentDir, publicDir: settings.publicDir, files }, null, 2)}\n`);
}

export async function checkArtifacts(settings) {
  await checkInputs(settings);
  const manifest = JSON.parse(await readFile(settings.manifestPath, 'utf8'));
  if (manifest.contentDir !== settings.contentDir || manifest.publicDir !== settings.publicDir) throw new Error('Build inputs differ from the artifact manifest; rebuild first');
  const actual = await outputFiles(settings);
  if (!actual['index.html'] || !actual['en/index.html'] || !actual['zh/index.html'] || !actual['404.html']) throw new Error('Required homepage or 404 output is missing');
  for (const file of new Set([...Object.keys(actual), ...Object.keys(manifest.files)])) {
    if (actual[file] !== manifest.files[file]) throw new Error(`Output differs from the verified build: ${file}`);
  }
  console.log(`Checked ${Object.keys(actual).length} output files and the public-file allowlist.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await checkArtifacts(readSiteConfig()); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
