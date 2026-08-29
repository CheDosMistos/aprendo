import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const planner = new URL('../scripts/plan-browser-e2e.sh', import.meta.url).pathname;

type Plan = { scope: string; specs: string[] };

function plan(baseRef: string, files: string[]): Plan {
  const output = execFileSync('bash', [planner, baseRef, ...files], { encoding: 'utf8' });
  const values = Object.fromEntries(
    output.trim().split('\n').filter(Boolean).map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
  );

  return {
    scope: values.scope,
    specs: values.specs ? values.specs.split(' ') : [],
  };
}

test('ordinary content, MusicXML and local layout changes do not start a browser', () => {
  for (const file of [
    'src/courses/bateria/content/pages/f2-u1-overview.md',
    'public/bateria/notation/f2/u1/example.musicxml',
    'src/pages/bateria/index.astro',
    'tests/battery-unit-card-contract.test.ts',
  ]) {
    assert.deepEqual(plan('main', [file]), { scope: 'none', specs: [] }, file);
  }
});

test('changed E2E specs run only that interaction on Chromium', () => {
  assert.deepEqual(plan('main', ['tests/e2e/battery-unit-cards.spec.ts']), {
    scope: 'targeted',
    specs: ['tests/e2e/battery-unit-cards.spec.ts'],
  });
});

test('browser-sensitive shared features map to focused targeted specs', () => {
  assert.deepEqual(plan('main', ['src/platform/notation/AlphaTabRenderer.ts']), {
    scope: 'targeted',
    specs: ['tests/e2e/first-sight.spec.ts', 'tests/e2e/musicxml-playback-audit.spec.ts'],
  });

  assert.deepEqual(plan('main', ['src/platform/components/MetronomeCompact.astro']), {
    scope: 'targeted',
    specs: ['tests/e2e/phase2-u10-complete.spec.ts'],
  });

  assert.deepEqual(plan('main', ['src/platform/components/PracticeTimer.astro']), {
    scope: 'targeted',
    specs: ['tests/e2e/practice-timer.spec.ts'],
  });
});

test('global auth and navigation changes run only the critical cross-browser journey', () => {
  for (const file of [
    'src/middleware.ts',
    'src/pages/login.astro',
    'src/platform/layouts/BaseLayout.astro',
    'src/pages/bateria/[unit]/index.astro',
  ]) {
    assert.deepEqual(plan('main', [file]), { scope: 'cross-browser', specs: [] }, file);
  }
});

test('Playwright and Browser workflow changes retain a full-suite escape hatch', () => {
  for (const file of [
    '.github/workflows/e2e.yml',
    'playwright.config.ts',
    'package-lock.json',
  ]) {
    assert.deepEqual(plan('main', [file]), { scope: 'full', specs: [] }, file);
  }
});

test('the highest-risk classification wins when a PR mixes changes', () => {
  assert.deepEqual(plan('main', [
    'tests/e2e/battery-unit-cards.spec.ts',
    'src/pages/login.astro',
    'playwright.config.ts',
  ]), { scope: 'full', specs: ['tests/e2e/battery-unit-cards.spec.ts'] });
});

test('integration branches keep the previous opt-in policy: changed E2E specs only', () => {
  assert.deepEqual(plan('integration/fase3-u1', ['src/platform/layouts/BaseLayout.astro']), {
    scope: 'none',
    specs: [],
  });
  assert.deepEqual(plan('integration/fase3-u1', ['tests/e2e/phase2-u10-complete.spec.ts']), {
    scope: 'targeted',
    specs: ['tests/e2e/phase2-u10-complete.spec.ts'],
  });
});
