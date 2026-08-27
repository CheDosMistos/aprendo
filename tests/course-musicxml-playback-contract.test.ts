import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { PAS_RUDIMENTS } from '../src/courses/bateria/rudiments/pasRudiments.ts';
import { generateRudimentStudyMusicXml } from '../src/courses/bateria/rudiments/rudimentStudyMusicXml.ts';
import { ensurePercussionPlaybackMapping } from '../src/platform/notation/ensurePercussionPlaybackMapping.ts';

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

function playbackMappingFailures(xml: string, label: string): string[] {
  const failures: string[] = [];
  const scoreInstrumentIds = new Set(
    [...xml.matchAll(/<score-instrument\b[^>]*id="([^"]+)"[^>]*>/g)].map((match) => match[1]),
  );
  const midiInstruments = new Map<string, string>(
    [...xml.matchAll(/<midi-instrument\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/midi-instrument>/g)]
      .map((match) => [match[1] ?? '', match[2] ?? '']),
  );
  const unpitchedNotes = [...xml.matchAll(/<note>([\s\S]*?)<\/note>/g)]
    .map((match) => match[1] ?? '')
    .filter((note) => note.includes('<unpitched>'));

  if (unpitchedNotes.length === 0) failures.push(`${label}: no contiene notas unpitched reproducibles`);
  if (scoreInstrumentIds.size === 0) failures.push(`${label}: falta score-instrument`);
  if (midiInstruments.size === 0) failures.push(`${label}: falta midi-instrument`);

  for (const [id, body] of midiInstruments) {
    if (!scoreInstrumentIds.has(id)) failures.push(`${label}: midi-instrument ${id} no tiene score-instrument correspondiente`);
    if (!/<midi-channel>10<\/midi-channel>/.test(body)) failures.push(`${label}: ${id} no usa canal MIDI 10 de percusión`);
    if (!/<midi-unpitched>\d+<\/midi-unpitched>/.test(body)) failures.push(`${label}: ${id} no declara midi-unpitched`);
  }

  for (const [index, note] of unpitchedNotes.entries()) {
    const instrumentId = note.match(/<instrument\b[^>]*id="([^"]+)"\s*\/>/)?.[1];
    if (!instrumentId) {
      failures.push(`${label}: nota unpitched ${index + 1} no declara instrument`);
      continue;
    }
    if (!scoreInstrumentIds.has(instrumentId)) failures.push(`${label}: nota ${index + 1} referencia score-instrument inexistente ${instrumentId}`);
    if (!midiInstruments.has(instrumentId)) failures.push(`${label}: nota ${index + 1} referencia instrumento sin midi-instrument ${instrumentId}`);
  }

  return failures;
}

function notationFingerprint(xml: string): string[] {
  const values = [...xml.matchAll(/<(duration|type|beats|beat-type|actual-notes|normal-notes|notehead|text)>([^<]*)<\/\1>/g)]
    .map((match) => `${match[1]}:${match[2]}`);
  const markers = [...xml.matchAll(/<(dot|grace|tie|tied|accent|strong-accent)\b[^>]*\/?\s*>/g)]
    .map((match) => match[0].replace(/\s+/g, ' '));
  const beams = [...xml.matchAll(/<beam\b([^>]*)>([^<]*)<\/beam>/g)]
    .map((match) => `beam:${match[1].replace(/\s+/g, ' ').trim()}:${match[2].trim()}`);
  return [...values, ...markers, ...beams];
}

test('every integrated static course MusicXML becomes audibly mapped without changing musical notation', async () => {
  const files = await musicXmlFiles(notationRoot);
  assert.ok(files.length > 0, 'Expected integrated MusicXML course assets');

  const failures: string[] = [];
  for (const file of files) {
    const label = path.relative(process.cwd(), file);
    const source = await readFile(file, 'utf8');
    const normalized = ensurePercussionPlaybackMapping(source);
    assert.deepEqual(notationFingerprint(normalized), notationFingerprint(source), `${label}: playback normalization changed musical notation`);
    assert.equal(ensurePercussionPlaybackMapping(normalized), normalized, `${label}: playback normalization must be idempotent`);
    failures.push(...playbackMappingFailures(normalized, label));
  }

  assert.deepEqual(failures, [], `MusicXML playback mapping failures after normalization:\n${failures.join('\n')}`);
});

test('all generated PAS study MusicXML is natively audible and normalization-safe', () => {
  const failures: string[] = [];
  for (const definition of PAS_RUDIMENTS) {
    const label = `PAS ${definition.pasNumber} — ${definition.name}`;
    const source = generateRudimentStudyMusicXml(definition);
    const normalized = ensurePercussionPlaybackMapping(source);
    assert.equal(normalized, source, `${label}: generated study should already contain complete playback metadata`);
    failures.push(...playbackMappingFailures(source, label));
  }

  assert.deepEqual(failures, [], `Generated rudiment playback mapping failures:\n${failures.join('\n')}`);
});