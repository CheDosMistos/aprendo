export const PAS_RUDIMENTS_PDF = 'https://pas.org/wp-content/uploads/2024/04/pas-rudiments.pdf';

export type RudimentStudyUnit = 'sixteenth' | 'thirty-second' | 'eighth-triplet' | 'sixteenth-triplet';

export interface PasRudimentStudyDefinition {
  pasNumber: number;
  name: string;
  pasName?: string;
  slug: string;
  aliases?: readonly string[];
  pattern: readonly string[];
  unit?: RudimentStudyUnit;
  accentIndices?: readonly number[];
}

const r = (
  pasNumber: number,
  name: string,
  slug: string,
  pattern: readonly string[],
  options: Partial<Omit<PasRudimentStudyDefinition, 'pasNumber' | 'name' | 'slug' | 'pattern'>> = {},
): PasRudimentStudyDefinition => ({ pasNumber, name, slug, pattern, unit: 'sixteenth', ...options });

/**
 * Curriculum registry for the 40 PAS rudiments.
 *
 * The patterns below are NOT a local copy of the PAS engraving. They are compact
 * original study skeletons used to render a sticking/articulation exercise beside
 * each rudiment section. PAS remains normative for exact rhythm, sticking, accents,
 * grace notes and roll notation.
 */
export const PAS_RUDIMENTS: readonly PasRudimentStudyDefinition[] = [
  r(1, 'Single Stroke Roll', '01-single-stroke-roll', ['R','L','R','L','R','L','R','L']),
  r(2, 'Single Stroke Four', '02-single-stroke-four', ['R','L','R','L'], { unit: 'sixteenth-triplet' }),
  r(3, 'Single Stroke Seven', '03-single-stroke-seven', ['R','L','R','L','R','L','R'], { unit: 'sixteenth-triplet' }),
  r(4, 'Multiple Bounce Roll', '04-multiple-bounce-roll', ['Rz','Lz','Rz','Lz','Rz','Lz','Rz','Lz']),
  r(5, 'Triple Stroke Roll', '05-triple-stroke-roll', ['R','R','R','L','L','L','R','R','R','L','L','L'], { unit: 'sixteenth-triplet' }),
  r(6, 'Double Stroke Open Roll', '06-double-stroke-open-roll', ['R','R','L','L','R','R','L','L']),
  r(7, 'Five Stroke Roll', '07-five-stroke-roll', ['R','R','L','L','R'], { accentIndices: [4] }),
  r(8, 'Six Stroke Roll', '08-six-stroke-roll', ['R','L','L','R','R','L'], { unit: 'sixteenth-triplet', accentIndices: [0,5] }),
  r(9, 'Seven Stroke Roll', '09-seven-stroke-roll', ['R','R','L','L','R','R','L'], { accentIndices: [6] }),
  r(10, 'Nine Stroke Roll', '10-nine-stroke-roll', ['R','R','L','L','R','R','L','L','R'], { unit: 'thirty-second', accentIndices: [8] }),
  r(11, 'Ten Stroke Roll', '11-ten-stroke-roll', ['R','R','L','L','R','R','L','L','R','L'], { unit: 'thirty-second', accentIndices: [8] }),
  r(12, 'Eleven Stroke Roll', '12-eleven-stroke-roll', ['R','R','L','L','R','R','L','L','R','R','L'], { unit: 'thirty-second', accentIndices: [10] }),
  r(13, 'Thirteen Stroke Roll', '13-thirteen-stroke-roll', ['R','R','L','L','R','R','L','L','R','R','L','L','R'], { unit: 'thirty-second', accentIndices: [12] }),
  r(14, 'Fifteen Stroke Roll', '14-fifteen-stroke-roll', ['R','R','L','L','R','R','L','L','R','R','L','L','R','R','L'], { unit: 'thirty-second', accentIndices: [14] }),
  r(15, 'Seventeen Stroke Roll', '15-seventeen-stroke-roll', ['R','R','L','L','R','R','L','L','R','R','L','L','R','R','L','L','R'], { unit: 'thirty-second', accentIndices: [16] }),
  r(16, 'Single Paradiddle', '16-single-paradiddle', ['R','L','R','R','L','R','L','L'], { accentIndices: [0,4] }),
  r(17, 'Double Paradiddle', '17-double-paradiddle', ['R','L','R','L','R','R','L','R','L','R','L','L'], { accentIndices: [0,6] }),
  r(18, 'Triple Paradiddle', '18-triple-paradiddle', ['R','L','R','L','R','L','R','R','L','R','L','R','L','R','L','L'], { accentIndices: [0,8] }),
  r(19, 'Single Paradiddle-Diddle', '19-single-paradiddle-diddle', ['R','L','R','R','L','L','L','R','L','L','R','R'], { accentIndices: [0,6], aliases: ['Single Paradiddle-diddle'] }),
  r(20, 'Flam', '20-flam', ['lR','rL'], { accentIndices: [0,1] }),
  r(21, 'Flam Accent', '21-flam-accent', ['lR','L','R','rL','R','L'], { unit: 'eighth-triplet', accentIndices: [0,3] }),
  r(22, 'Flam Tap', '22-flam-tap', ['lR','R','rL','L','lR','R','rL','L'], { accentIndices: [0,2,4,6] }),
  r(23, 'Flamacue', '23-flamacue', ['lR','L','R','L','rR','rL','R','L','R','lL'], { accentIndices: [0,4,5,9] }),
  r(24, 'Flam Paradiddle', '24-flam-paradiddle', ['lR','L','R','R','rL','R','L','L'], { accentIndices: [0,4] }),
  r(25, 'Single Flammed Mill', '25-single-flammed-mill', ['lR','R','L','R','rL','L','R','L'], { accentIndices: [0,4] }),
  r(26, 'Flam Paradiddle-Diddle', '26-flam-paradiddle-diddle', ['lR','L','R','R','L','L','rL','R','L','L','R','R'], { accentIndices: [0,6], aliases: ['Flam Paradiddle-diddle'] }),
  r(27, 'Pataflafla', '27-pataflafla', ['lR','L','R','rL','rL','R','L','lR'], { accentIndices: [0,3,4,7] }),
  r(28, 'Swiss Army Triplet', '28-swiss-army-triplet', ['lR','R','L','rL','L','R'], { unit: 'eighth-triplet', accentIndices: [0,3] }),
  r(29, 'Inverted Flam Tap', '29-inverted-flam-tap', ['lR','L','rL','R','rL','R','lR','L'], { accentIndices: [0,2,4,6] }),
  r(30, 'Flam Drag', '30-flam-drag', ['lR','L','L','R','rL','R','R','L'], { accentIndices: [0,4] }),
  r(31, 'Drag (Ruff)', '31-drag', ['(ll)R','(rr)L'], { pasName: 'Drag', aliases: ['Drag','Drag (Ruff)'], accentIndices: [0,1] }),
  r(32, 'Single Drag Tap', '32-single-drag-tap', ['(ll)R','L','R','(rr)L','R','L'], { accentIndices: [0,3] }),
  r(33, 'Double Drag Tap', '33-double-drag-tap', ['(ll)R','(ll)R','L','(rr)L','(rr)L','R'], { accentIndices: [0,3] }),
  r(34, 'Lesson 25', '34-lesson-25', ['(ll)R','L','R','(rr)L','R','L'], { unit: 'eighth-triplet', accentIndices: [0,3] }),
  r(35, 'Single Dragadiddle', '35-single-dragadiddle', ['(rr)R','L','R','R','(ll)L','R','L','L'], { accentIndices: [0,4] }),
  r(36, 'Drag Paradiddle #1', '36-drag-paradiddle-1', ['R','(ll)R','L','R','R','L','(rr)L','R','L','L'], { accentIndices: [0,5] }),
  r(37, 'Drag Paradiddle #2', '37-drag-paradiddle-2', ['R','(ll)R','(ll)R','L','R','R'], { accentIndices: [0] }),
  r(38, 'Single Ratamacue', '38-single-ratamacue', ['(ll)R','L','R','L','(rr)L','R','L','R'], { unit: 'eighth-triplet', accentIndices: [0,4] }),
  r(39, 'Double Ratamacue', '39-double-ratamacue', ['(ll)R','(ll)R','L','R','L','(rr)L','(rr)L','R','L','R'], { unit: 'eighth-triplet', accentIndices: [0,5] }),
  r(40, 'Triple Ratamacue', '40-triple-ratamacue', ['(ll)R','(ll)R','(ll)R','L','R','L'], { unit: 'eighth-triplet', accentIndices: [0] }),
] as const;

export function normalizeRudimentText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[–—#()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function findPasRudiment(name: string): PasRudimentStudyDefinition | undefined {
  const target = normalizeRudimentText(name);
  return PAS_RUDIMENTS.find((definition) => {
    const candidates = [definition.name, definition.pasName, ...(definition.aliases ?? [])].filter(Boolean) as string[];
    return candidates.some((candidate) => normalizeRudimentText(candidate) === target);
  });
}

export function headingMatchesRudiment(heading: string, definition: PasRudimentStudyDefinition): boolean {
  const normalizedHeading = ` ${normalizeRudimentText(heading)} `;
  const candidates = [definition.name, definition.pasName, ...(definition.aliases ?? [])].filter(Boolean) as string[];
  return candidates
    .map(normalizeRudimentText)
    .sort((a, b) => b.length - a.length)
    .some((candidate) => normalizedHeading.includes(` ${candidate} `));
}
