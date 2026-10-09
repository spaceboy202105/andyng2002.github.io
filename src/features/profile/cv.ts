import type { Locale } from '../../i18n';
import { assetHref } from '../../i18n';
import { readSiteConfig } from '../../../scripts/site-config.mjs';
import { checkCv } from '../../../scripts/cv-files.mjs';

export function getCvLinks(): Partial<Record<Locale, string>> {
  const links: Partial<Record<Locale, string>> = {};
  let available;
  try { available = checkCv(readSiteConfig()); }
  catch { return links; }
  for (const locale of ['zh', 'en'] as const) {
    if (available[locale]) links[locale] = assetHref(`cv/${locale}.pdf`);
  }
  return links;
}
