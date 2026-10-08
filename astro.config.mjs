import { defineConfig } from 'astro/config';
import { readSiteConfig } from './scripts/site-config.mjs';
import { checkInputs, recordArtifacts } from './scripts/check-artifacts.mjs';

const settings = readSiteConfig();
await checkInputs(settings);
export default defineConfig({
  site: settings.site,
  base: settings.base,
  outDir: settings.outDir,
  publicDir: settings.publicDir,
  cacheDir: settings.cacheDir,
  output: 'static',
  trailingSlash: 'always',
  integrations: [{ name: 'approved-output', hooks: { 'astro:build:done': () => recordArtifacts(settings) } }],
});
