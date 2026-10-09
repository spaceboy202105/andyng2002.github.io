import type { CollectionEntry } from 'astro:content';

export function resolveRelated({ article, publications, projects }: {
  article: CollectionEntry<'blog'>;
  publications: CollectionEntry<'publications'>[];
  projects: CollectionEntry<'projects'>[];
}) {
  return {
    publications: article.data.relatedPublications.map(id => {
      const entry = publications.find(entry => entry.id === id);
      if (!entry) throw new Error(`blog/${article.id}: relatedPublications references missing or unapproved publication ${id}`);
      return entry;
    }),
    projects: article.data.relatedProjects.map(id => {
      const entry = projects.find(entry => entry.id === id);
      if (!entry) throw new Error(`blog/${article.id}: relatedProjects references missing or unapproved project ${id}`);
      return entry;
    }),
  };
}
