import path from 'node:path';
import { existsSync, realpathSync } from 'node:fs';

export function readSiteConfig() {
  const root = realpathSync(process.cwd());
  const directory = (name, fallback) => {
    const requested = path.resolve(root, process.env[name] ?? fallback);
    let existing = requested;
    while (!existsSync(existing)) existing = path.dirname(existing);
    const resolved = path.resolve(realpathSync(existing), path.relative(existing, requested));
    const relative = path.relative(root, resolved);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.toLowerCase() === 'raw')) {
      throw new Error(`${name} must stay inside the project and outside raw: ${requested}`);
    }
    return resolved;
  };
  const site = new URL(process.env.SITE_URL ?? 'http://127.0.0.1:4321');
  if (!['http:', 'https:'].includes(site.protocol) || site.pathname !== '/' || site.search || site.hash || site.username || site.password) {
    throw new Error('SITE_URL must be an http or https origin without a path or credentials');
  }
  const inputBase = process.env.SITE_BASE_PATH ?? '/';
  if (!/^(?:\/|\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?)$/.test(inputBase)) throw new Error('SITE_BASE_PATH must be a local path such as / or /preview/');
  const base = inputBase === '/' ? '/' : `${inputBase.replace(/\/$/, '')}/`;
  const contentDir = directory('SITE_CONTENT_DIR', 'src/content');
  const publicDir = directory('SITE_PUBLIC_DIR', 'public');
  const cvSourceDir = directory('CV_SOURCE_DIR', 'cv');
  const outDir = directory('SITE_OUTPUT_DIR', 'dist');
  const protectedDirectories = [contentDir, publicDir, cvSourceDir, ...['src', 'tests', 'scripts', 'docs', 'node_modules', '.git'].map(name => path.join(root, name))];
  for (const protectedDirectory of protectedDirectories) {
    if ([path.relative(outDir, protectedDirectory), path.relative(protectedDirectory, outDir)].some(relative => !relative || (!relative.startsWith('..') && !path.isAbsolute(relative)))) {
      throw new Error(`SITE_OUTPUT_DIR overlaps a source directory: ${outDir}`);
    }
  }
  return { site: site.origin, base, contentDir, publicDir, cvSourceDir, cvManifestPath: path.join(cvSourceDir, 'manifest.json'), outDir, cacheDir: `${outDir}.cache`, manifestPath: `${outDir}.manifest.json` };
}
