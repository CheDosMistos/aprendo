import { getCollection, type CollectionEntry } from 'astro:content';

export type BateriaContentEntry = CollectionEntry<'bateria'>;

export async function getBateriaContent(): Promise<BateriaContentEntry[]> {
  const entries = (await getCollection('bateria')).filter((entry) => entry.data.published);

  const stableIds = new Set<string>();
  const routes = new Set<string>();

  for (const entry of entries) {
    if (stableIds.has(entry.data.contentId)) {
      throw new Error(`Duplicate battery contentId: ${entry.data.contentId}`);
    }
    stableIds.add(entry.data.contentId);

    const route = entry.data.kind === 'unit'
      ? `/bateria/${entry.data.unitSlug}/`
      : `/bateria/${entry.data.unitSlug}/${entry.data.slug}/`;

    if (routes.has(route)) {
      throw new Error(`Duplicate battery content route: ${route}`);
    }
    routes.add(route);
  }

  return entries.sort((a, b) =>
    a.data.phase - b.data.phase ||
    a.data.unit - b.data.unit ||
    a.data.order - b.data.order,
  );
}

export function routeFor(entry: BateriaContentEntry): string {
  return entry.data.kind === 'unit'
    ? `/bateria/${entry.data.unitSlug}/`
    : `/bateria/${entry.data.unitSlug}/${entry.data.slug}/`;
}

export function unitEntries(
  entries: BateriaContentEntry[],
  phase: number,
  unit: number,
): BateriaContentEntry[] {
  return entries.filter((entry) => entry.data.phase === phase && entry.data.unit === unit);
}
