import type { PasRudimentStudyDefinition, RudimentStudyUnit } from './pasRudiments';

const DIVISIONS = 24;
const MEASURE_DURATION = DIVISIONS * 4;
const ORIGINAL_BADGE = 'Aprendo - EJERCICIO ORIGINAL CREADO PARA ESTE CURSO';

interface UnitSpec {
  duration: number;
  type: 'eighth' | '16th' | '32nd';
  beams: number;
  groupSize: number;
  timeModification?: { actual: number; normal: number };
}

const UNIT_SPECS: Record<RudimentStudyUnit, UnitSpec> = {
  sixteenth: { duration: 6, type: '16th', beams: 2, groupSize: 4 },
  'thirty-second': { duration: 3, type: '32nd', beams: 3, groupSize: 8 },
  'eighth-triplet': {
    duration: 8,
    type: 'eighth',
    beams: 1,
    groupSize: 3,
    timeModification: { actual: 3, normal: 2 },
  },
  'sixteenth-triplet': {
    duration: 4,
    type: '16th',
    beams: 2,
    groupSize: 3,
    timeModification: { actual: 3, normal: 2 },
  },
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function parseStudyToken(token: string): { grace: string[]; main: 'R' | 'L'; label: string } {
  const drag = token.match(/^\(([lr]+)\)([RL])$/);
  if (drag) return { grace: [...drag[1]], main: drag[2] as 'R' | 'L', label: drag[2] };

  const flam = token.match(/^([lr])([RL])$/);
  if (flam) return { grace: [flam[1]], main: flam[2] as 'R' | 'L', label: flam[2] };

  const buzz = token.match(/^([RL])z$/);
  if (buzz) return { grace: [], main: buzz[1] as 'R' | 'L', label: `${buzz[1]}z` };

  if (token === 'R' || token === 'L') return { grace: [], main: token, label: token };
  throw new Error(`Unsupported rudiment study token: ${token}`);
}

function graceNote(hand: string): string {
  return `<note><grace slash="yes"/><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched><type>16th</type><notehead>normal</notehead><lyric><text>${escapeXml(hand.toLowerCase())}</text></lyric></note>`;
}

function beams(index: number, count: number, spec: UnitSpec): string {
  if (spec.beams === 0 || count === 1) return '';
  const groupStart = Math.floor(index / spec.groupSize) * spec.groupSize;
  const groupEnd = Math.min(groupStart + spec.groupSize, count) - 1;
  if (groupStart === groupEnd) return '';

  const state = index === groupStart
    ? 'begin'
    : index === groupEnd
      ? 'end'
      : 'continue';
  return Array.from({ length: spec.beams }, (_, beamIndex) => `<beam number="${beamIndex + 1}">${state}</beam>`).join('');
}

function mainNote(
  token: string,
  index: number,
  count: number,
  spec: UnitSpec,
  accent: boolean,
): string {
  const parsed = parseStudyToken(token);
  const grace = parsed.grace.map(graceNote).join('');
  const timeModification = spec.timeModification
    ? `<time-modification><actual-notes>${spec.timeModification.actual}</actual-notes><normal-notes>${spec.timeModification.normal}</normal-notes></time-modification>`
    : '';
  const articulation = accent ? '<notations><articulations><accent/></articulations></notations>' : '';
  const buzzDirection = parsed.label.endsWith('z')
    ? '<notations><ornaments><tremolo type="single">3</tremolo></ornaments></notations>'
    : articulation;
  const notation = parsed.label.endsWith('z') ? buzzDirection : articulation;

  return `${grace}<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched><duration>${spec.duration}</duration><type>${spec.type}</type>${timeModification}<notehead>normal</notehead>${beams(index, count, spec)}${notation}<lyric><text>${escapeXml(parsed.label)}</text></lyric></note>`;
}

export function generateRudimentStudyMusicXml(definition: PasRudimentStudyDefinition): string {
  const spec = UNIT_SPECS[definition.unit ?? 'sixteenth'];
  const soundingDuration = definition.pattern.length * spec.duration;
  if (soundingDuration > MEASURE_DURATION) {
    throw new Error(`${definition.name}: study pattern exceeds one 4/4 measure`);
  }

  const accentSet = new Set(definition.accentIndices ?? []);
  const notes = definition.pattern
    .map((token, index) => mainNote(token, index, definition.pattern.length, spec, accentSet.has(index)))
    .join('\n      ');
  const remainder = MEASURE_DURATION - soundingDuration;
  const forward = remainder > 0 ? `<forward><duration>${remainder}</duration></forward>` : '';
  const title = `PAS ${definition.pasNumber} — estudio de ${definition.name}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>${escapeXml(title)}</work-title></work>
  <identification>
    <creator type="composer">${ORIGINAL_BADGE}</creator>
    <rights>Estudio original de estructura y sticking. No reproduce la partitura PAS; la fuente PAS enlazada es normativa.</rights>
  </identification>
  <part-list><score-part id="P1"><part-name>Pad</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>${DIVISIONS}</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>percussion</sign><line>2</line></clef><staff-details><staff-lines>5</staff-lines></staff-details></attributes>
      <sound tempo="120"/>
      ${notes}
      ${forward}
    </measure>
  </part>
</score-partwise>`;
}
