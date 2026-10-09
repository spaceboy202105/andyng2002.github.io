import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { localizedText, localImagePath } from '../content/fields';

export const profile = defineCollection({
  loader: approvedMarkdownLoader({ name: 'profile' }),
  schema: ({ image }) => z.object({
    approved: approval,
    brand: z.string().trim().min(1),
    name: localizedText,
    bio: localizedText,
    portrait: z.preprocess(localImagePath, image()),
    portraitAlt: localizedText,
    contacts: z.array(z.object({ label: z.string().trim().min(1), href: z.url().refine(value => ['https:', 'http:', 'mailto:'].includes(new URL(value).protocol), 'Contact href must use https, http or mailto') })),
  }),
});
