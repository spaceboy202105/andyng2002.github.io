import { defineConfig } from 'astro/config';
import { readSiteConfig } from './scripts/site-config.mjs';
import { checkInputs, recordArtifacts } from './scripts/check-artifacts.mjs';

import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { safeMarkdown } from './src/features/blog/markdown.mjs';

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
  markdown: {
    syntaxHighlight: 'prism',
    processor: unified({ remarkPlugins: [[safeMarkdown, { base: settings.base, publicDir: settings.publicDir }], remarkMath], rehypePlugins: [[rehypeKatex, { trust: false, strict: 'error' }]] }),
  },
  integrations: [{ name: 'approved-output', hooks: { 'astro:build:done': () => recordArtifacts(settings) } }],
});
