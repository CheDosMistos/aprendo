import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { COMPETENCY_ID_PATTERN, PAS_RUDIMENTS, PHASE_1_PAS_BY_UNIT, validatePhase1PasPlan } from '../src/courses/bateria/curriculum.ts';

test('Phase 1 PAS plan contains the 40 canonical PAS rudiments exactly once', () => {
  assert.doesNotThrow(() => validatePhase1PasPlan());
  const flattened = Object.values(PHASE_1_PAS_BY_UNIT).flat();
  assert.equal(flattened.length, 40);
  assert.equal(new Set(flattened).size, 40);
  assert.deepEqual(new Set(flattened), new Set(PAS_RUDIMENTS));
  assert.deepEqual(PHASE_1_PAS_BY_UNIT[10], []);
});

test('competency ID vocabulary includes approved I5/I6 and rejects unknown axis identifiers', () => {
  for (const id of ['A1', 'B6', 'C4', 'D1', 'E3', 'F2', 'G6', 'H8', 'I4', 'I5', 'I6', 'J9', 'K8']) {
    assert.match(id, COMPETENCY_ID_PATTERN);
  }
  for (const id of ['A9', 'B9', 'I7', 'L1', 'K9', 'C0', '']) {
    assert.doesNotMatch(id, COMPETENCY_ID_PATTERN);
  }
});

test('learner-facing battery content does not leak internal curricular/editorial identifiers', () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ['scripts/audit-bateria-learner-language.mjs', '--enforce'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  });
});
