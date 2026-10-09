import { getCollection } from 'astro:content';

export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) => (b.data.date ?? '').localeCompare(a.data.date ?? '') || a.id.localeCompare(b.id));
}
