export const COMPETENCY_ID_PATTERN = /^(?:A[1-8]|B[1-8]|C[1-7]|D[1-7]|E[1-7]|F[1-7]|G[1-6]|H[1-8]|I[1-4]|J[1-9]|K[1-8])$/;

export const PAS_RUDIMENTS = [
  'Single Stroke Roll',
  'Single Stroke Four',
  'Single Stroke Seven',
  'Multiple Bounce Roll',
  'Triple Stroke Roll',
  'Double Stroke Open Roll',
  'Five Stroke Roll',
  'Six Stroke Roll',
  'Seven Stroke Roll',
  'Nine Stroke Roll',
  'Ten Stroke Roll',
  'Eleven Stroke Roll',
  'Thirteen Stroke Roll',
  'Fifteen Stroke Roll',
  'Seventeen Stroke Roll',
  'Single Paradiddle',
  'Double Paradiddle',
  'Triple Paradiddle',
  'Single Paradiddle-diddle',
  'Flam',
  'Flam Accent',
  'Flam Tap',
  'Flamacue',
  'Flam Paradiddle',
  'Single Flammed Mill',
  'Flam Paradiddle-diddle',
  'Pataflafla',
  'Swiss Army Triplet',
  'Inverted Flam Tap',
  'Flam Drag',
  'Drag (Ruff)',
  'Single Drag Tap',
  'Double Drag Tap',
  'Lesson 25',
  'Single Dragadiddle',
  'Drag Paradiddle #1',
  'Drag Paradiddle #2',
  'Single Ratamacue',
  'Double Ratamacue',
  'Triple Ratamacue',
] as const;

export type PasRudiment = (typeof PAS_RUDIMENTS)[number];
export const PAS_RUDIMENT_SET = new Set<string>(PAS_RUDIMENTS);

export const PHASE_1_PAS_BY_UNIT: Readonly<Record<number, readonly PasRudiment[]>> = {
  1: ['Single Stroke Roll', 'Multiple Bounce Roll', 'Double Stroke Open Roll', 'Single Paradiddle', 'Flam', 'Drag (Ruff)'],
  2: ['Single Stroke Four', 'Single Stroke Seven', 'Double Paradiddle', 'Triple Paradiddle', 'Single Paradiddle-diddle', 'Five Stroke Roll'],
  3: ['Nine Stroke Roll', 'Seven Stroke Roll', 'Flam Tap', 'Flam Accent', 'Lesson 25', 'Single Drag Tap'],
  4: ['Thirteen Stroke Roll', 'Fifteen Stroke Roll', 'Seventeen Stroke Roll', 'Six Stroke Roll'],
  5: ['Ten Stroke Roll', 'Eleven Stroke Roll', 'Single Dragadiddle', 'Drag Paradiddle #1', 'Drag Paradiddle #2'],
  6: ['Single Flammed Mill', 'Swiss Army Triplet', 'Flamacue'],
  7: ['Triple Stroke Roll', 'Flam Paradiddle', 'Pataflafla', 'Double Drag Tap'],
  8: ['Flam Paradiddle-diddle', 'Single Ratamacue', 'Double Ratamacue'],
  9: ['Triple Ratamacue', 'Inverted Flam Tap', 'Flam Drag'],
  10: [],
};

export function validatePhase1PasPlan(): void {
  const flattened = Object.values(PHASE_1_PAS_BY_UNIT).flat();
  const unique = new Set(flattened);
  if (flattened.length !== 40 || unique.size !== 40) {
    throw new Error(`Phase 1 PAS plan must contain exactly 40 unique rudiments; got ${flattened.length}/${unique.size}.`);
  }
  for (const rudiment of PAS_RUDIMENTS) {
    if (!unique.has(rudiment)) throw new Error(`Phase 1 PAS plan is missing: ${rudiment}`);
  }
}
