import { getCollection } from 'astro:content';

export async function getPublications() {
  return (await getCollection('publications')).sort((a, b) => b.data.year - a.data.year || a.id.localeCompare(b.id));
}
