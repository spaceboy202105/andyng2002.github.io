import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { calendarDate, externalUrl, localizedText, localImagePath } from '../content/fields';

export const projects = defineCollection({
  loader: approvedMarkdownLoader({ name: 'projects' }),
  schema: ({ image }) => z.object({
    approved: approval,
    featured: z.boolean().default(false),
    name: localizedText,
    summary: localizedText,
    role: localizedText,
    cover: z.preprocess(localImagePath, image()).optional(),
    coverAlt: localizedText.optional(),
    date: calendarDate.optional(),
    codeUrl: externalUrl.optional(),
    demoUrl: externalUrl.optional(),
  }).refine(data => Boolean(data.cover) === Boolean(data.coverAlt), {
    message: 'Project cover and coverAlt must be provided together',
    path: ['coverAlt'],
  }),
});
