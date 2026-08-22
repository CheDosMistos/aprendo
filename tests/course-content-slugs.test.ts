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

test('battery content slugs are unique across the Astro collection', async () => {
  const files = await markdownFiles(contentRoot);
  const seen = new Map<string, string>();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const match = source.match(/^slug:\s*([^\n\r]+)$/m);
    assert.ok(match, `${file}: expected a slug in frontmatter`);

    const slug = match[1]!.trim();
    const previous = seen.get(slug);
    assert.equal(previous, undefined, `${file}: duplicate slug '${slug}' already used by ${previous}`);
    seen.set(slug, file);
  }
});
