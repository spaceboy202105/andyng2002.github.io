import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { externalUrl, localizedText, localImagePath } from '../content/fields';

export const publications = defineCollection({
  loader: approvedMarkdownLoader({ name: 'publications' }),
  schema: ({ image }) => z.object({
    approved: approval,
    featured: z.boolean().default(false),
    title: z.string().trim().min(1),
    authors: z.array(z.string().trim().min(1)).min(1),
    year: z.number().int().min(1900).max(2100),
    status: z.enum(['preprint', 'submitted', 'accepted', 'published']),
    summary: localizedText,
    venue: z.string().trim().min(1).optional(),
    paperUrl: externalUrl.optional(),
    codeUrl: externalUrl.optional(),
    cover: z.preprocess(localImagePath, image()).optional(),
    coverAlt: localizedText.optional(),
  }).refine(entry => !entry.cover || entry.coverAlt, { message: 'coverAlt requires both languages when cover is present', path: ['coverAlt'] }),
});
