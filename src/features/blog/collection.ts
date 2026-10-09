import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { calendarDate } from '../content/fields';

export const blog = defineCollection({
  loader: approvedMarkdownLoader({ name: 'blog', body: 'markdown' }),
  schema: z.object({
    approved: approval,
    storyId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    lang: z.enum(['en', 'zh']),
    originalLang: z.enum(['en', 'zh']),
    title: z.string().trim().min(1),
    publishedAt: calendarDate,
    updatedAt: calendarDate.optional(),
    tags: z.array(z.string().trim().min(1)),
    summary: z.string().trim().min(1).optional(),
    relatedPublications: z.array(z.string().min(1)).default([]),
    relatedProjects: z.array(z.string().min(1)).default([]),
  }).refine(entry => !entry.updatedAt || entry.updatedAt >= entry.publishedAt, { message: 'updatedAt cannot precede publishedAt', path: ['updatedAt'] }),
});
