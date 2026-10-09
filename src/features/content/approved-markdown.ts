import type { Loader, DataStore } from 'astro/loaders';
import { parseFrontmatter } from 'astro/markdown';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'astro/zod';
import { readSiteConfig } from '../../../scripts/site-config.mjs';

export const approval = z.boolean().default(false);

export function approvedMarkdownLoader({ name }: { name: string }): Loader {
  const directory = path.join(readSiteConfig().contentDir, name);
  return {
    name: `approved-${name}`,
    async load({ config, store, parseData, watcher, logger }) {
      async function sync() {
        const files = await readdir(directory, { withFileTypes: true }).catch(error => {
          if (error.code === 'ENOENT') return [];
          throw error;
        });
        const pending: Parameters<DataStore['set']>[0][] = [];
        for (const file of files.filter(file => file.isFile() && file.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name))) {
          const filePath = path.join(directory, file.name);
          let entry;
          try { entry = parseFrontmatter(await readFile(filePath, 'utf8')); }
          catch (error) { throw new Error(`${name}/${file.name}: frontmatter: ${error instanceof Error ? error.message : String(error)}`); }
          const flag = approval.safeParse(entry.frontmatter.approved);
          if (!flag.success) throw new Error(`${name}/${file.name}: approved must be true or false`);
          if (!flag.data) continue;
          if (entry.content.trim()) throw new Error(`${name}/${file.name}: body must be empty; use the bilingual fields`);
          const id = path.basename(file.name, '.md');
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`${name}/${file.name}: filename must be a stable lowercase ID`);
          const data = await parseData({ id, data: entry.frontmatter, filePath });
          pending.push({ id, data, filePath: path.relative(fileURLToPath(config.root), filePath) });
        }
        store.clear();
        for (const entry of pending) store.set(entry);
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
}
