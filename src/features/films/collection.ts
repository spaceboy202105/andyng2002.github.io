import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { calendarDate } from '../content/fields';

export const films = defineCollection({
  loader: approvedMarkdownLoader({ name: 'films', body: 'markdown' }),
  schema: z.object({
    approved: approval,
    title: z.string().trim().min(1),
    lang: z.enum(['en', 'zh']),
    publishedAt: calendarDate,
  }),
});
