import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import path from 'node:path';
import { readSiteConfig } from '../../../scripts/site-config.mjs';

const localizedText = z.object({ en: z.string().trim().min(1), zh: z.string().trim().min(1) });

export const profile = defineCollection({
  loader: glob({ base: path.join(readSiteConfig().contentDir, 'profile'), pattern: '*.md' }),
  schema: ({ image }) => z.object({
    approved: z.boolean().default(false),
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
