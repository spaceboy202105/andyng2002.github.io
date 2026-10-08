import { defineCollection } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { parseFrontmatter } from 'astro/markdown';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';
import path from 'node:path';
import { readSiteConfig } from '../../../scripts/site-config.mjs';

const localizedText = z.object({ en: z.string().trim().min(1), zh: z.string().trim().min(1) });

const approval = z.object({ approved: z.boolean().default(false) });
const directory = path.join(readSiteConfig().contentDir, 'profile');
const loader: Loader = {
  name: 'approved-profile',
  async load({ config, store, parseData, watcher, logger }) {
    async function sync() {
      store.clear();
      const files = (await readdir(directory, { withFileTypes: true }))
        .filter(file => file.isFile() && file.name.endsWith('.md'))
        .map(file => file.name).sort();
      for (const file of files) {
        const filePath = path.join(directory, file);
        let entry;
        try { entry = parseFrontmatter(await readFile(filePath, 'utf8')); }
        catch (error) { throw new Error(`profile/${file}: frontmatter: ${error instanceof Error ? error.message : String(error)}`); }
        const flag = approval.safeParse(entry.frontmatter);
        if (!flag.success) throw new Error(`profile/${file}: approved must be true or false`);
        if (!flag.data.approved) continue;
        if (entry.content.trim()) throw new Error(`profile/${file}: body must be empty; use the bilingual bio fields`);
        const id = path.basename(file, '.md');
        const data = await parseData({ id, data: entry.frontmatter, filePath });
        store.set({ id, data, filePath: path.relative(fileURLToPath(config.root), filePath) });
      }
    }
    await sync();
    if (watcher) {
      watcher.add(directory);
      let pending = Promise.resolve();
      const refresh = (file: string) => {
        if (path.dirname(file) !== directory || !file.endsWith('.md')) return;
        pending = pending.then(sync).catch(error => logger.error(error instanceof Error ? error.message : String(error)));
      };
      for (const event of ['add', 'change', 'unlink']) watcher.on(event, refresh);
    }
  },
};

export const profile = defineCollection({
  loader,
  schema: ({ image }) => z.object({
    approved: approval.shape.approved,
    brand: z.string().trim().min(1),
    name: localizedText,
    bio: localizedText,
    portrait: z.preprocess((value, context) => {
      if (typeof value !== 'string' || !/^\.\.\/\.\.\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|avif)$/.test(value)) {
        context.addIssue({ code: 'custom', message: 'Portrait must be a local file in the approved assets directory' });
      }
      return value;
    }, image()),
    portraitAlt: localizedText,
    contacts: z.array(z.object({ label: z.string().trim().min(1), href: z.url().refine(value => ['https:', 'http:', 'mailto:'].includes(new URL(value).protocol), 'Contact href must use https, http or mailto') })),
  }),
});
