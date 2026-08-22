import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const notationRoot = path.resolve('public/bateria/notation');

async function musicXmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return musicXmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.musicxml') ? [fullPath] : [];
  }));
  return nested.flat();
}

test('course MusicXML uses complete percussion staves and explicit noteheads', async () => {
  const files = await musicXmlFiles(notationRoot);
  assert.ok(files.length > 0, 'Expected course MusicXML fixtures');

  for (const file of files) {
    const xml = await readFile(file, 'utf8');
    assert.match(xml, /<staff-lines>5<\/staff-lines>/, `${file}: expected a complete five-line staff`);
    assert.doesNotMatch(xml, /<staff-lines>1<\/staff-lines>/, `${file}: one-line staves are not allowed in course notation`);
    assert.match(xml, /<sound tempo="120"\/>/, `${file}: course playback uses a 120 BPM reference tempo`);

    for (const match of xml.matchAll(/<note>([\s\S]*?)<\/note>/g)) {
      const note = match[1] ?? '';
      if (!note.includes('<unpitched>')) continue;
      assert.match(note, /<notehead>[^<]+<\/notehead>/, `${file}: each unpitched note must declare its notehead explicitly`);
    }
  }
});
