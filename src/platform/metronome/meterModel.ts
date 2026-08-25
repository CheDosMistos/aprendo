export type MeterGrouping = '2+2+3' | '3+2+2';
export type TickRole = 'bar' | 'pulse' | 'subdivision';

export interface MetronomeTick {
  durationUnits: number;
  visualIndex: number;
  role: TickRole;
}

export interface MetronomePlan {
  meter: string;
  bpmUnitLabel: string;
  ticks: MetronomeTick[];
  visualCount: number;
  groupStarts: number[];
  allowedSubdivisions: number[];
  defaultSubdivision: number;
  groupingEnabled: boolean;
  ariaLabel: string;
}

function simplePlan(meter: string, subdivision: number): MetronomePlan {
  const numerator = Number.parseInt(meter.split('/')[0] ?? '4', 10);
  const pulseCount = Number.isFinite(numerator) && numerator > 0 ? numerator : 4;
  const parts = [1, 2, 3, 4].includes(subdivision) ? subdivision : 1;
  const ticks: MetronomeTick[] = [];

  for (let pulse = 0; pulse < pulseCount; pulse += 1) {
    for (let part = 0; part < parts; part += 1) {
      ticks.push({
        durationUnits: 1 / parts,
        visualIndex: pulse,
        role: part === 0 ? (pulse === 0 ? 'bar' : 'pulse') : 'subdivision',
      });
    }
  }

  return {
    meter,
    bpmUnitLabel: 'BPM · negra',
    ticks,
    visualCount: pulseCount,
    groupStarts: [0],
    allowedSubdivisions: [1, 2, 3, 4],
    defaultSubdivision: 1,
    groupingEnabled: false,
    ariaLabel: `${pulseCount} pulsos de negra en ${meter}`,
  };
}

function compoundSixEightPlan(subdivision: number): MetronomePlan {
  const parts = subdivision === 1 ? 1 : 3;
  const ticks: MetronomeTick[] = [];
  for (let pulse = 0; pulse < 2; pulse += 1) {
    for (let part = 0; part < parts; part += 1) {
      ticks.push({
        durationUnits: 1 / parts,
        visualIndex: pulse,
        role: part === 0 ? (pulse === 0 ? 'bar' : 'pulse') : 'subdivision',
      });
    }
  }

  return {
    meter: '6/8',
    bpmUnitLabel: 'BPM · negra con puntillo',
    ticks,
    visualCount: 2,
    groupStarts: [0, 1],
    allowedSubdivisions: [1, 3],
    defaultSubdivision: 3,
    groupingEnabled: false,
    ariaLabel: 'Dos pulsos compuestos en 6/8, cada uno divisible en tres corcheas',
  };
}

function additiveSevenEightPlan(grouping: MeterGrouping): MetronomePlan {
  const groups = grouping === '3+2+2' ? [3, 2, 2] : [2, 2, 3];
  const groupStarts: number[] = [];
  let slot = 0;
  for (const group of groups) {
    groupStarts.push(slot);
    slot += group;
  }

  const ticks: MetronomeTick[] = Array.from({ length: 7 }, (_, index) => ({
    durationUnits: 1,
    visualIndex: index,
    role: index === 0 ? 'bar' : groupStarts.includes(index) ? 'pulse' : 'subdivision',
  }));

  return {
    meter: '7/8',
    bpmUnitLabel: 'BPM · corchea',
    ticks,
    visualCount: 7,
    groupStarts,
    allowedSubdivisions: [1],
    defaultSubdivision: 1,
    groupingEnabled: true,
    ariaLabel: `Siete corcheas en 7/8 agrupadas ${grouping}`,
  };
}

export function buildMetronomePlan(
  meter: string,
  subdivision: number,
  grouping: MeterGrouping = '2+2+3',
): MetronomePlan {
  if (meter === '6/8') return compoundSixEightPlan(subdivision);
  if (meter === '7/8') return additiveSevenEightPlan(grouping);
  return simplePlan(meter, subdivision);
}
