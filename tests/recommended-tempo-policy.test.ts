import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRecommendedTempoForPlay, resolveRecommendedTempoReset } from '../src/platform/notation/recommendedTempoPolicy.ts';

test('Caso A: primera reproducción sin intervención usa el tempo recomendado', () => {
  const decision = resolveRecommendedTempoForPlay(90, 120, false, false);
  assert.deepEqual(decision, { bpm: 120, syncMetronome: true, hasPlayed: true });
});

test('Caso B: una selección manual antes del primer Play prevalece', () => {
  const decision = resolveRecommendedTempoForPlay(70, 120, false, true);
  assert.deepEqual(decision, { bpm: 70, syncMetronome: false, hasPlayed: true });
});

test('Caso C: después de la primera reproducción no se vuelve a imponer el recomendado', () => {
  const decision = resolveRecommendedTempoForPlay(90, 120, true, true);
  assert.deepEqual(decision, { bpm: 90, syncMetronome: false, hasPlayed: true });
});

test('Caso D: Restablecer vuelve explícitamente al tempo recomendado', () => {
  assert.deepEqual(resolveRecommendedTempoReset(75, 120), { bpm: 120, syncMetronome: true });
});

test('Caso E: una partitura sin tempo recomendado conserva el BPM actual', () => {
  const playDecision = resolveRecommendedTempoForPlay(83, null, false, false);
  assert.deepEqual(playDecision, { bpm: 83, syncMetronome: false, hasPlayed: true });
  assert.deepEqual(resolveRecommendedTempoReset(83, null), { bpm: 83, syncMetronome: false });
});
