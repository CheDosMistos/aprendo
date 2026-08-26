import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const notationRoot = path.resolve('public/bateria/notation');
const contentRoot = path.resolve('src/courses/bateria/content/pages');
const scoreReferencesComponent = path.resolve('src/platform/components/CourseScoreReferences.astro');
const lessonPage = path.resolve('src/pages/bateria/[unit]/[slug].astro');
const originalBadge = 'EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';
const pasSourceUrl = 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf';

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

function hasAssignedRudiments(markdown: string): boolean {
  const data = frontmatter(markdown);
  const inline = data.match(/^rudiments:\s*\[([^\]]*)\]/m)?.[1]?.trim();
  if (inline) return inline.length > 0;
  return /^rudiments:\s*$[\s\S]*?^\s+-\s+\S/m.test(data);
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

test('every course MusicXML measure closes on its written meter, including multiple voices', async () => {
  const files = await musicXmlFiles(notationRoot);
  for (const file of files) validateMeasureDurations(await readFile(file, 'utf8'), file);
});

test('published course score references resolve and identify original material', async () => {
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

test('lessons that teach PAS rudiments include embedded original study notation and the PAS normative link', async () => {
  const pages = await filesWithExtension(contentRoot, '.md');
  const failures: string[] = [];
  let rudimentLessons = 0;

  for (const page of pages) {
    const markdown = await readFile(page, 'utf8');
    const data = frontmatter(markdown);
    if (!/^kind:\s*lesson\s*$/m.test(data) || !hasAssignedRudiments(markdown)) continue;

    rudimentLessons += 1;
    const scoreTags = [...markdown.matchAll(/<div\b[^>]*data-notation-score[^>]*>/g)].map((match) => match[0]);
    if (scoreTags.length === 0) failures.push(`${page}: no embedded original study notation`);
    if (!markdown.includes(pasSourceUrl)) failures.push(`${page}: no official PAS normative link`);
  }

  assert.ok(rudimentLessons > 0, 'Expected Phase 1 lessons with PAS rudiments');
  assert.deepEqual(failures, [], `PAS lesson score contract failures:\n${failures.join('\n')}`);
});
