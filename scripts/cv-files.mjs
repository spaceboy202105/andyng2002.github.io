import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export const cvLocales = ['zh', 'en'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function cvSources(directory, prefix = '') {
  const sources = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isFile()) throw new Error(`CV sources must be regular files or directories: ${entry.name}`);
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) Object.assign(sources, cvSources(path.join(directory, entry.name), `${name}/`));
    else if (entry.name.endsWith('.tex')) sources[name] = sha256(readFileSync(path.join(directory, entry.name)));
  }
  return sources;
}

/** @returns {Partial<Record<'zh' | 'en', boolean>>} */
export function checkCv(settings, publicDir = settings.publicDir) {
  if (!existsSync(settings.cvManifestPath)) {
    for (const locale of cvLocales) if (existsSync(path.join(publicDir, 'cv', `${locale}.pdf`))) throw new Error('CV manifest missing; run npm run build:cv');
    return {};
  }
  const manifest = JSON.parse(readFileSync(settings.cvManifestPath, 'utf8'));
  const sources = cvSources(settings.cvSourceDir);
  if (manifest.version !== 1 || !manifest.sources || !manifest.pdfs || !sources['zh.tex'] || !sources['en.tex']) throw new Error('Invalid CV manifest or missing source; run npm run build:cv');
  for (const file of new Set([...Object.keys(sources), ...Object.keys(manifest.sources)])) {
    if (sources[file] !== manifest.sources[file]) throw new Error(`Stale CV source: ${file}; run npm run build:cv`);
  }
  const available = {};
  for (const locale of cvLocales) {
    const file = path.join(publicDir, 'cv', `${locale}.pdf`);
    if (!existsSync(file)) continue;
    const bytes = readFileSync(file);
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-')) || sha256(bytes) !== manifest.pdfs[locale]) throw new Error(`CV PDF hash mismatch: ${locale}`);
    available[locale] = true;
  }
  return available;
}
