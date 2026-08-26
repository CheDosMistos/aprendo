import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const contentRoot = path.resolve('src/courses/bateria/content/pages');

async function markdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  }));
  return nested.flat();
}

function frontmatterValue(source: string, key: string): string | undefined {
  return source.match(new RegExp(`^${key}:\\s*([^\\n\\r]+)$`, 'm'))?.[1]?.trim();
}

test('battery content slugs are unique and unit slugs encode their phase safely', async () => {
  const files = await markdownFiles(contentRoot);
  const seen = new Map<string, string>();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const slug = frontmatterValue(source, 'slug');
    const phase = Number(frontmatterValue(source, 'phase'));
    const unit = Number(frontmatterValue(source, 'unit'));
    const unitSlug = frontmatterValue(source, 'unitSlug');

    assert.ok(slug, `${file}: expected a slug in frontmatter`);
    assert.ok(Number.isInteger(phase) && phase > 0, `${file}: expected a positive phase`);
    assert.ok(Number.isInteger(unit) && unit > 0, `${file}: expected a positive unit`);
    assert.ok(unitSlug, `${file}: expected a unitSlug in frontmatter`);

    const previous = seen.get(slug);
    assert.equal(previous, undefined, `${file}: duplicate slug '${slug}' already used by ${previous}`);
    seen.set(slug, file);

    const expectedUnitSlug = phase === 1 ? `unidad-${unit}` : `fase-${phase}-unidad-${unit}`;
    assert.equal(unitSlug, expectedUnitSlug, `${file}: expected unitSlug '${expectedUnitSlug}'`);
  }
});
