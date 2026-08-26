import { getCollection, type CollectionEntry } from 'astro:content';
import { PHASE_1_PAS_BY_UNIT, validatePhase1PasPlan } from './curriculum';

export type BateriaContentEntry = CollectionEntry<'bateria'>;

export async function getBateriaContent(): Promise<BateriaContentEntry[]> {
  validatePhase1PasPlan();
  const entries = (await getCollection('bateria')).filter((entry) => entry.data.published);

  const stableIds = new Set<string>();
  const routes = new Set<string>();
  const unitOrders = new Set<string>();
  const overviewCounts = new Map<string, number>();

  for (const entry of entries) {
    if (stableIds.has(entry.data.contentId)) {
      throw new Error(`Duplicate battery contentId: ${entry.data.contentId}`);
    }
    stableIds.add(entry.data.contentId);

    const expectedUnitSlug = entry.data.phase === 1
      ? `unidad-${entry.data.unit}`
      : `fase-${entry.data.phase}-unidad-${entry.data.unit}`;
    if (entry.data.unitSlug !== expectedUnitSlug) {
      throw new Error(`Battery unitSlug mismatch for ${entry.data.contentId}: expected ${expectedUnitSlug}, got ${entry.data.unitSlug}`);
    }

    const unitKey = `${entry.data.phase}:${entry.data.unit}`;
    const orderKey = `${unitKey}:${entry.data.order}`;
    if (unitOrders.has(orderKey)) {
      throw new Error(`Duplicate battery order ${entry.data.order} in phase ${entry.data.phase}, unit ${entry.data.unit}`);
    }
    unitOrders.add(orderKey);

    if (entry.data.kind === 'unit') {
      overviewCounts.set(unitKey, (overviewCounts.get(unitKey) ?? 0) + 1);
    }

    if (entry.data.phase === 1 && entry.data.rudiments.length > 0) {
      const allowed = new Set(PHASE_1_PAS_BY_UNIT[entry.data.unit] ?? []);
      for (const rudiment of entry.data.rudiments) {
        if (!allowed.has(rudiment)) {
          throw new Error(`PAS rudiment assigned to wrong Phase 1 unit: ${rudiment} in unit ${entry.data.unit}`);
        }
      }
    }

    const route = entry.data.kind === 'unit'
      ? `/bateria/${entry.data.unitSlug}/`
      : `/bateria/${entry.data.unitSlug}/${entry.data.slug}/`;

    if (routes.has(route)) {
      throw new Error(`Duplicate battery content route: ${route}`);
    }
    routes.add(route);
  }

  for (const [unitKey, count] of overviewCounts) {
    if (count !== 1) throw new Error(`Battery unit ${unitKey} must have exactly one overview; got ${count}.`);
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
