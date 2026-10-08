import { getCollection, type CollectionEntry } from 'astro:content';
export type Profile = CollectionEntry<'profile'>;

export async function getProfile(): Promise<Profile> {
  const profiles = await getCollection('profile', ({ data }) => data.approved);
  const profile = profiles[0];
  if (profiles.length !== 1 || !profile) throw new Error('profile: exactly one approved profile is required');
  return profile;
}
