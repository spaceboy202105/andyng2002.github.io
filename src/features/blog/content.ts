import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../../i18n';

type Article = CollectionEntry<'blog'>;

export async function getBlogEntries() {
  const entries = await getCollection('blog');
  const stories = new Map<string, Article[]>();
  for (const entry of entries) {
    const versions = stories.get(entry.data.storyId) ?? [];
    if (versions.some(version => version.data.lang === entry.data.lang)) throw new Error(`blog/${entry.id}: duplicate storyId/lang ${entry.data.storyId}/${entry.data.lang}`);
    if (versions.some(version => version.data.originalLang !== entry.data.originalLang || version.data.publishedAt !== entry.data.publishedAt)) throw new Error(`blog/${entry.id}: story ${entry.data.storyId} must have consistent originalLang and publishedAt`);
    versions.push(entry);
    stories.set(entry.data.storyId, versions);
  }
  for (const [storyId, versions] of stories) {
    if (!versions.some(version => version.data.lang === version.data.originalLang)) throw new Error(`blog/${storyId}: approved originalLang version is required`);
  }
  return entries.sort((a, b) => b.data.publishedAt.localeCompare(a.data.publishedAt) || a.data.storyId.localeCompare(b.data.storyId) || a.data.lang.localeCompare(b.data.lang));
}

export function selectArticle({ entries, storyId, locale }: { entries: Article[]; storyId: string; locale: Locale }): Article | undefined {
  const versions = entries.filter(entry => entry.data.storyId === storyId);
  return versions.find(entry => entry.data.lang === locale) ?? versions.find(entry => entry.data.lang === entry.data.originalLang);
}

export function selectStories({ entries, locale }: { entries: Article[]; locale: Locale }): Article[] {
  return [...new Set(entries.map(entry => entry.data.storyId))].flatMap(storyId => {
    const article = selectArticle({ entries, storyId, locale });
    return article ? [article] : [];
  });
}
