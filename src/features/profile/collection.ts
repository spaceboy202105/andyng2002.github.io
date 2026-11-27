import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { approval, approvedMarkdownLoader } from '../content/approved-markdown';
import { localizedText, localImagePath, externalUrl } from '../content/fields';

const bioText = z.string().trim().min(1).transform(text => [text]).or(
  z.array(z.union([
    z.string().min(1),
    z.object({ text: z.string().trim().min(1), href: externalUrl }),
  ])).min(1),
);

export const profile = defineCollection({
  loader: approvedMarkdownLoader({ name: 'profile' }),
  schema: ({ image }) => z.object({
    approved: approval,
    brand: z.string().trim().min(1),
    name: localizedText,
    bio: z.object({ en: bioText, zh: bioText }),
    portrait: z.preprocess(localImagePath, image()),
    portraitAlt: localizedText,
    thesis: z.object({
      cover: z.preprocess(localImagePath, image()),
      coverAlt: localizedText,
      title: localizedText,
      summary: localizedText,
      institution: localizedText,
      year: z.number().int().positive(),
      pdfPath: z.literal('papers/undergraduate-thesis.pdf'),
    }).optional(),
    education: z.array(z.object({
      institution: localizedText,
      school: localizedText,
      schoolHref: z.object({ en: externalUrl, zh: externalUrl }).optional(),
      degree: localizedText,
      period: localizedText,
      advisor: z.object({ name: localizedText, href: externalUrl }),
    })).default([]),
    internships: z.array(z.object({
      company: localizedText,
      companyHref: z.object({ en: externalUrl, zh: externalUrl }).optional(),
      location: localizedText,
      role: localizedText,
      period: localizedText,
      researchProjects: z.array(localizedText).min(1).optional(),
    })).default([]),
    hobbies: z.array(localizedText.extend({ icon: z.enum(['camera', 'music', 'badminton', 'dumbbell', 'film']) })).default([]),
    contacts: z.array(z.object({ label: z.string().trim().min(1), href: z.url().refine(value => ['https:', 'http:', 'mailto:'].includes(new URL(value).protocol), 'Contact href must use https, http or mailto') })),
  }),
});
