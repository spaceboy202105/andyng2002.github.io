import { z } from 'astro/zod';

export const localizedText = z.object({ en: z.string().trim().min(1), zh: z.string().trim().min(1) });
export const externalUrl = z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'URL must use https or http');
export const localImagePath = (value: unknown, context: z.RefinementCtx) => {
  if (typeof value !== 'string' || !/^\.\.\/\.\.\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|avif)$/.test(value)) {
    context.addIssue({ code: 'custom', message: 'Image must be a local file in the approved assets directory' });
  }
  return value;
};
