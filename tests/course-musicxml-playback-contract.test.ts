import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { PAS_RUDIMENTS } from '../src/courses/bateria/rudiments/pasRudiments.ts';
import { generateRudimentStudyMusicXml } from '../src/courses/bateria/rudiments/rudimentStudyMusicXml.ts';

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

test('every integrated static course MusicXML has an explicit audible percussion mapping', async () => {
  const files = await musicXmlFiles(notationRoot);
  assert.ok(files.length > 0, 'Expected integrated MusicXML course assets');

  const failures: string[] = [];
  for (const file of files) {
    const label = path.relative(process.cwd(), file);
    failures.push(...playbackMappingFailures(await readFile(file, 'utf8'), label));
  }

  assert.deepEqual(failures, [], `MusicXML playback mapping failures:\n${failures.join('\n')}`);
});

test('all generated PAS study MusicXML has an explicit audible percussion mapping', () => {
  const failures: string[] = [];
  for (const definition of PAS_RUDIMENTS) {
    const label = `PAS ${definition.pasNumber} — ${definition.name}`;
    failures.push(...playbackMappingFailures(generateRudimentStudyMusicXml(definition), label));
  }

  assert.deepEqual(failures, [], `Generated rudiment playback mapping failures:\n${failures.join('\n')}`);
});