import { getCollection } from 'astro:content';

/** All published (non-draft) projects, ordered: `order` ascending, then newest update. */
export async function getProjects() {
  const all = await getCollection('projects', ({ data }) => !data.draft);
  return all.sort(
    (a, b) => a.data.order - b.data.order || b.data.updated.valueOf() - a.data.updated.valueOf(),
  );
}
