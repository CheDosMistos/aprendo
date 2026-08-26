import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  findPasRudiment,
  headingMatchesRudiment,
  PAS_RUDIMENTS,
  PAS_RUDIMENTS_PDF,
} from '../src/courses/bateria/rudiments/pasRudiments.ts';
import { generateRudimentStudyMusicXml } from '../src/courses/bateria/rudiments/rudimentStudyMusicXml.ts';

const notationRoot = path.resolve('public/bateria/notation');
const contentRoot = path.resolve('src/courses/bateria/content/pages');
const scoreReferencesComponent = path.resolve('src/platform/components/CourseScoreReferences.astro');
const autoEmbedComponent = path.resolve('src/courses/bateria/components/RudimentNotationAutoEmbed.astro');
const lessonPage = path.resolve('src/pages/bateria/[unit]/[slug].astro');
const originalBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
const internalOriginalBadge = `Aprendo - ${originalBadge}`;
const pasSourceUrl = PAS_RUDIMENTS_PDF;

async function filesWithExtension(dir: string, extension: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesWithExtension(fullPath, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [fullPath] : [];
  }));
  return nested.flat();
}

async function musicXmlFiles(dir: string): Promise<string[]> {
  return filesWithExtension(dir, '.musicxml');
}

function tagNumber(xml: string, tag: string): number | null {
  const match = xml.match(new RegExp(`<${tag}>(\\d+)<\\/${tag}>`));
  return match ? Number(match[1]) : null;
}

function validateMeasureDurations(xml: string, file: string) {
  let divisions: number | null = null;
  let beats: number | null = null;
  let beatType: number | null = null;
  const measures = [...xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)];
  assert.ok(measures.length > 0, `${file}: expected at least one measure`);

  for (const [index, measureMatch] of measures.entries()) {
    const measure = measureMatch[1] ?? '';
    divisions = tagNumber(measure, 'divisions') ?? divisions;
    beats = tagNumber(measure, 'beats') ?? beats;
    beatType = tagNumber(measure, 'beat-type') ?? beatType;

    assert.ok(divisions !== null && beats !== null && beatType !== null, `${file}: measure ${index + 1} lacks inherited divisions/time`);
    const currentDivisions: number = Number(divisions);
    const currentBeats: number = Number(beats);
    const currentBeatType: number = Number(beatType);
    const expected: number = currentDivisions * currentBeats * 4 / currentBeatType;
    assert.ok(Number.isInteger(expected), `${file}: measure ${index + 1} has a non-integral expected duration`);

    let cursor = 0;
    let maxCursor = 0;
    let lastNoteStart = 0;
    const events = measure.matchAll(/<(note|backup|forward)\b[^>]*>([\s\S]*?)<\/\1>/g);

    for (const event of events) {
      const kind = event[1];
      const body = event[2] ?? '';
      const duration = tagNumber(body, 'duration');

      if (kind === 'backup') {
        assert.ok(duration !== null, `${file}: measure ${index + 1} backup lacks duration`);
        cursor -= duration;
        assert.ok(cursor >= 0, `${file}: measure ${index + 1} backup moves before measure start`);
        continue;
      }

      if (kind === 'forward') {
        assert.ok(duration !== null, `${file}: measure ${index + 1} forward lacks duration`);
        cursor += duration;
        maxCursor = Math.max(maxCursor, cursor);
        continue;
      }

      if (body.includes('<grace')) continue;
      assert.ok(duration !== null, `${file}: measure ${index + 1} sounding/rest note lacks duration`);

      if (body.includes('<chord')) {
        maxCursor = Math.max(maxCursor, lastNoteStart + duration);
      } else {
        lastNoteStart = cursor;
        cursor += duration;
        maxCursor = Math.max(maxCursor, cursor);
      }
    }

    assert.equal(maxCursor, expected, `${file}: measure ${index + 1} duration ${maxCursor} != expected ${expected}`);
  }
}

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function assignedRudiments(markdown: string): string[] {
  const data = frontmatter(markdown);
  const inline = data.match(/^rudiments:\s*\[([^\]]*)\]\s*$/m)?.[1];
  if (inline !== undefined) {
    return inline.split(',').map((value) => value.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }

  const lines = data.split('\n');
  const start = lines.findIndex((line) => /^rudiments:\s*$/.test(line));
  if (start < 0) return [];

  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s+-\s+(.+?)\s*$/)?.[1];
    if (!item) break;
    values.push(item.replace(/^['"]|['"]$/g, ''));
  }
  return values;
}

function markdownHeadings(markdown: string): string[] {
  return [...markdown.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map((match) => match[1] ?? '');
}

test('course MusicXML uses complete percussion staves, explicit noteheads and original provenance', async () => {
  const files = await musicXmlFiles(notationRoot);
  assert.ok(files.length > 0, 'Expected course MusicXML fixtures');

  for (const file of files) {
    const xml = await readFile(file, 'utf8');
    assert.match(xml, /<staff-lines>5<\/staff-lines>/, `${file}: expected a complete five-line staff`);
    assert.doesNotMatch(xml, /<staff-lines>1<\/staff-lines>/, `${file}: one-line staves are not allowed in course notation`);
    assert.match(xml, /<sound tempo="120"\/>/, `${file}: course playback uses a 120 BPM reference tempo`);
    assert.ok(xml.includes(originalBadge), `${file}: original course asset must carry provenance inside MusicXML`);

    for (const match of xml.matchAll(/<note>([\s\S]*?)<\/note>/g)) {
      const note = match[1] ?? '';
      if (!note.includes('<unpitched>')) continue;
      assert.match(note, /<notehead>[^<]+<\/notehead>/, `${file}: each unpitched note must declare its notehead explicitly`);
    }
  }
});

test('every static course MusicXML measure closes on its written meter, including multiple voices', async () => {
  const files = await musicXmlFiles(notationRoot);
  for (const file of files) validateMeasureDurations(await readFile(file, 'utf8'), file);
});

test('the PAS registry contains exactly the 40 unique normative rudiment identities', () => {
  assert.equal(PAS_RUDIMENTS.length, 40);
  assert.deepEqual(PAS_RUDIMENTS.map((definition) => definition.pasNumber), Array.from({ length: 40 }, (_, index) => index + 1));
  assert.equal(new Set(PAS_RUDIMENTS.map((definition) => definition.slug)).size, 40, 'PAS study slugs must be unique');
  assert.equal(new Set(PAS_RUDIMENTS.map((definition) => definition.name)).size, 40, 'PAS study names must be unique');
});

test('all 40 generated rudiment studies are metrically complete, playable original MusicXML', () => {
  for (const definition of PAS_RUDIMENTS) {
    const label = `PAS ${definition.pasNumber} ${definition.name}`;
    const xml = generateRudimentStudyMusicXml(definition);
    assert.match(xml, /<score-partwise version="4\.0">/, `${label}: expected MusicXML 4.0`);
    assert.match(xml, /<staff-lines>5<\/staff-lines>/, `${label}: expected five-line percussion staff`);
    assert.match(xml, /<sound tempo="120"\/>/, `${label}: expected 120 BPM reference tempo`);
    assert.ok(xml.includes(internalOriginalBadge), `${label}: missing internal original-material provenance`);
    assert.match(xml, /No reproduce la partitura PAS/, `${label}: must state that the study is not PAS engraving`);
    assert.doesNotMatch(xml, /creator type="composer">[^<]*Percussive Arts Society/i, `${label}: original study must not claim PAS authorship`);
    assert.ok(xml.includes('<lyric><text>'), `${label}: study must expose sticking labels`);
    for (const match of xml.matchAll(/<note>([\s\S]*?)<\/note>/g)) {
      const note = match[1] ?? '';
      if (!note.includes('<unpitched>')) continue;
      assert.match(note, /<notehead>[^<]+<\/notehead>/, `${label}: unpitched note lacks explicit notehead`);
    }
    validateMeasureDurations(xml, label);
  }
});

test('published static course score references resolve and identify original material', async () => {
  const pages = await filesWithExtension(contentRoot, '.md');
  let references = 0;

  for (const page of pages) {
    const markdown = await readFile(page, 'utf8');
    for (const match of markdown.matchAll(/<div\b[^>]*data-notation-score[^>]*>/g)) {
      const tag = match[0];
      const src = tag.match(/data-score-src="([^"]+)"/)?.[1];
      if (!src) continue;
      references += 1;
      assert.ok(tag.includes(`data-score-badge="${originalBadge}"`), `${page}: local course score must expose its original-material badge`);
      assert.ok(src.startsWith('/bateria/notation/'), `${page}: unexpected local score path ${src}`);
      await access(path.resolve('public', src.slice(1)));

      const explicitSourceUrl = tag.match(/data-score-source-url="([^"]+)"/)?.[1];
      const explicitSourceLabel = tag.match(/data-score-source-label="([^"]+)"/)?.[1];
      if (explicitSourceUrl) {
        assert.ok(explicitSourceLabel, `${page}: explicit companion or normative URL must have a readable label`);
      }
    }
  }

  assert.ok(references > 0, 'Expected published course score references');
});

test('Phase 1 introduces exactly the 40 PAS rudiments and every assignment resolves to the registry', async () => {
  const pages = await filesWithExtension(contentRoot, '.md');
  const introduced = new Set<string>();
  const failures: string[] = [];

  for (const page of pages) {
    const markdown = await readFile(page, 'utf8');
    const data = frontmatter(markdown);
    if (!/^phase:\s*1\s*$/m.test(data) || !/^kind:\s*lesson\s*$/m.test(data)) continue;

    for (const name of assignedRudiments(markdown)) {
      const definition = findPasRudiment(name);
      if (!definition) failures.push(`${path.basename(page)}: unknown rudiment '${name}'`);
      else introduced.add(definition.name);
    }
  }

  assert.deepEqual(failures, [], `Unknown PAS assignments:\n${failures.join('\n')}`);
  assert.equal(introduced.size, 40, `Expected 40 unique PAS rudiments in Phase 1, found ${introduced.size}`);
  assert.deepEqual([...introduced].sort(), PAS_RUDIMENTS.map((definition) => definition.name).sort());
});

test('every PAS rudiment assignment has a matching lesson section for automatic score embedding', async () => {
  const pages = await filesWithExtension(contentRoot, '.md');
  const failures: string[] = [];
  let assignments = 0;

  for (const page of pages) {
    const markdown = await readFile(page, 'utf8');
    const data = frontmatter(markdown);
    if (!/^phase:\s*1\s*$/m.test(data) || !/^kind:\s*lesson\s*$/m.test(data)) continue;
    const headings = markdownHeadings(markdown);

    for (const name of assignedRudiments(markdown)) {
      assignments += 1;
      const definition = findPasRudiment(name);
      if (!definition) continue;
      if (!headings.some((heading) => headingMatchesRudiment(heading, definition))) {
        failures.push(`${path.basename(page)}: '${name}' has no matching H2/H3 section`);
      }
    }
  }

  assert.ok(assignments >= 40, 'Expected at least one assignment for every PAS rudiment');
  assert.deepEqual(failures, [], `Rudiment sections missing:\n${failures.join('\n')}`);
});

test('rudiment score embedding is a per-rudiment contract, not a loose per-lesson score count', async () => {
  const component = await readFile(autoEmbedComponent, 'utf8');
  const page = await readFile(lessonPage, 'utf8');
  const references = await readFile(scoreReferencesComponent, 'utf8');

  assert.match(page, /RudimentNotationAutoEmbed/);
  assert.match(page, /rudiments=\{entry\.data\.rudiments\}/);
  assert.match(component, /data-score-rudiment/);
  assert.match(component, /\/bateria\/notation\/rudiments\//);
  assert.match(component, /Referencia normativa PAS/);
  assert.match(component, /existingPasStudy/);
  assert.match(references, /Abrir fuente MusicXML/);
  assert.ok(page.includes(pasSourceUrl), 'lesson page must expose the official PAS normative PDF');
});

test('score UI exposes the rendered MusicXML source and keeps PAS as a distinct normative lesson reference', async () => {
  const component = await readFile(scoreReferencesComponent, 'utf8');
  const page = await readFile(lessonPage, 'utf8');

  assert.match(component, /const scoreSource = score\.dataset\.scoreSrc/);
  assert.match(component, /Abrir fuente MusicXML/);
  assert.match(component, /normativeReferenceUrl/);
  assert.match(component, /Referencia normativa de los rudimentos de esta lección/);

  assert.ok(page.includes(pasSourceUrl), 'rudiment pages must link the official PAS PDF');
  assert.match(page, /entry\.data\.rudiments\.length > 0/);
  assert.match(page, /PAS — International Drum Rudiments/);
});
