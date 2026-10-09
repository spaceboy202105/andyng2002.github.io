import { z } from 'astro/zod';

export const localizedText = z.object({ en: z.string().trim().min(1), zh: z.string().trim().min(1) });
export const externalUrl = z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'URL must use https or http');
export const localImagePath = (value: unknown, context: z.RefinementCtx) => {
  if (typeof value !== 'string' || !/^\.\.\/\.\.\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|avif)$/.test(value)) {
    context.addIssue({ code: 'custom', message: 'Image must be a local file in the approved assets directory' });
  }
  return value;
};
export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a real calendar date');
