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
    authors: z.array(z.union([
      z.string().trim().min(1),
      z.object({ name: z.string().trim().min(1), url: externalUrl }),
    ])).min(1),
    year: z.number().int().min(1900).max(2100),
    status: z.enum(['preprint', 'submitted', 'accepted', 'published']),
    summary: localizedText,
    venue: z.string().trim().min(1).optional(),
    paperUrl: externalUrl.optional(),
    projectPath: z.string().regex(/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/$/).optional(),
    correspondingAuthor: z.string().trim().min(1).optional(),
    equalContributionAuthors: z.array(z.string().trim().min(1)).min(2).optional(),
    codeUrl: externalUrl.optional(),
    cover: z.preprocess(localImagePath, image()),
    homeCover: z.preprocess(localImagePath, image()).optional(),
    coverAlt: localizedText,
  }).superRefine((publication, ctx) => {
    const equal = publication.equalContributionAuthors;
    const names = publication.authors.map(author => typeof author === 'string' ? author : author.name);
    if (equal && (new Set(equal).size !== equal.length || equal.some(name => !names.includes(name)))) {
      ctx.addIssue({ code: 'custom', path: ['equalContributionAuthors'], message: 'Equal contributors must be distinct listed authors.' });
    }
    if (publication.correspondingAuthor && !names.includes(publication.correspondingAuthor)) {
      ctx.addIssue({ code: 'custom', path: ['correspondingAuthor'], message: 'The corresponding author must be a listed author.' });
    }
  }),
});
