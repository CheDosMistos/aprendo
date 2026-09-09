import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMetronomePlan,
  metronomeBpmToQuarterBpm,
  quarterBpmToMetronomeBpm,
} from '../src/platform/metronome/meterModel.ts';

test('6/8 is modeled as two compound pulses, not six equal beats', () => {
  const plan = buildMetronomePlan('6/8', 3);
  assert.equal(plan.bpmUnitLabel, 'BPM · negra con puntillo');
  assert.equal(plan.visualCount, 2);
  assert.deepEqual(plan.allowedSubdivisions, [1, 3]);
  assert.equal(plan.ticks.length, 6);
  assert.deepEqual(plan.ticks.filter((tick) => tick.role !== 'subdivision').map((tick) => tick.visualIndex), [0, 1]);
  assert.ok(plan.ticks.every((tick) => tick.durationUnits === 1 / 3));
});

test('7/8 keeps seven eighth-note slots while accents express grouping', () => {
  const first = buildMetronomePlan('7/8', 1, '2+2+3');
  assert.equal(first.bpmUnitLabel, 'BPM · corchea');
  assert.equal(first.visualCount, 7);
  assert.equal(first.ticks.length, 7);
  assert.deepEqual(first.groupStarts, [0, 2, 4]);
  assert.deepEqual(first.ticks.filter((tick) => tick.role !== 'subdivision').map((tick) => tick.visualIndex), [0, 2, 4]);

  const second = buildMetronomePlan('7/8', 1, '3+2+2');
  assert.deepEqual(second.groupStarts, [0, 3, 5]);
});

test('simple meters retain quarter-note pulse and optional subdivision', () => {
  const plan = buildMetronomePlan('4/4', 4);
  assert.equal(plan.bpmUnitLabel, 'BPM · negra');
  assert.equal(plan.visualCount, 4);
  assert.equal(plan.ticks.length, 16);
  assert.deepEqual(plan.ticks.filter((tick) => tick.role !== 'subdivision').map((tick) => tick.visualIndex), [0, 1, 2, 3]);
});

test('metronome BPM converts to quarter-note playback tempo without losing pulse semantics', () => {
  assert.equal(metronomeBpmToQuarterBpm(80, '4/4'), 80);
  assert.equal(quarterBpmToMetronomeBpm(80, '4/4'), 80);

  assert.equal(metronomeBpmToQuarterBpm(80, '6/8'), 120);
  assert.equal(quarterBpmToMetronomeBpm(120, '6/8'), 80);
  assert.equal(metronomeBpmToQuarterBpm(81, '6/8'), 121.5);

  assert.equal(metronomeBpmToQuarterBpm(240, '7/8'), 120);
  assert.equal(quarterBpmToMetronomeBpm(120, '7/8'), 240);
});
