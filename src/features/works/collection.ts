import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { localizedText, localImagePath } from '../content/fields';

export const works = defineCollection({
  loader: approvedMarkdownLoader({ name: 'works' }),
  schema: ({ image }) => z.object({
    approved: approval,
    title: localizedText,
    image: z.preprocess(localImagePath, image()),
    imageAlt: localizedText,
  }),
});
