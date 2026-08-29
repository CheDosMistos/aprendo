import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Check remains the exhaustive pre-merge validation gate and caches npm downloads', async () => {
  const workflow = await read('.github/workflows/ci.yml');

  assert.match(workflow, /cache:\s*npm/);
  assert.match(workflow, /Run full tests/);
  assert.match(workflow, /run:\s*npm test/);
  assert.match(workflow, /Test SQLite backup helper/);
  assert.match(workflow, /Test Nginx plain proxy migration/);
  assert.match(workflow, /Build site/);
  assert.match(workflow, /Exercise platform authentication flow/);
});

test('Browser E2E plans risk before installing Node, building or starting browsers', async () => {
  const workflow = await read('.github/workflows/e2e.yml');
  const plannerStart = workflow.indexOf('  plan_browser:');
  const browserStart = workflow.indexOf('  browser-e2e:');

  assert.ok(plannerStart >= 0 && browserStart > plannerStart, 'planner must precede browser execution');
  const planner = workflow.slice(plannerStart, browserStart);
  const browser = workflow.slice(browserStart);

  assert.match(planner, /bash scripts\/plan-browser-e2e\.sh/);
  assert.doesNotMatch(planner, /Setup Node\.js/);
  assert.doesNotMatch(planner, /npm ci/);
  assert.doesNotMatch(planner, /Build site/);
  assert.doesNotMatch(planner, /playwright install/);

  assert.match(browser, /needs:\s*plan_browser/);
  assert.match(browser, /needs\.plan_browser\.outputs\.scope != 'none'/);
  assert.match(browser, /Setup Node\.js/);
  assert.match(browser, /cache:\s*npm/);
  assert.match(browser, /Build site/);
});

test('Browser E2E has NONE, TARGETED, CROSS_BROWSER and FULL execution paths without universal journeys', async () => {
  const workflow = await read('.github/workflows/e2e.yml');
  const policy = await read('scripts/plan-browser-e2e.sh');

  assert.match(policy, /scope=none/);
  assert.match(policy, /promote targeted/);
  assert.match(policy, /promote cross-browser/);
  assert.match(policy, /promote full/);

  assert.match(workflow, /Install Chromium for targeted E2E/);
  assert.match(workflow, /npx playwright test --project=chromium-desktop/);
  assert.match(workflow, /Install Chromium and WebKit for cross-browser or full E2E/);
  assert.match(workflow, /tests\/e2e\/critical-smoke\.spec\.ts/);
  assert.match(workflow, /High-risk Browser E2E change detected: running the complete browser suite/);
  assert.match(workflow, /npm run test:e2e/);

  assert.doesNotMatch(workflow, /tests\/e2e\/aprendo\.spec\.ts/);
  assert.doesNotMatch(workflow, /tests\/e2e\/first-sight\.spec\.ts[\s\\]+tests\/e2e\/battery-unit-cards\.spec\.ts/);
});

test('Browser E2E keeps browser caching but only inside the conditional browser job', async () => {
  const workflow = await read('.github/workflows/e2e.yml');

  assert.match(workflow, /actions\/cache@v4/);
  assert.match(workflow, /playwright-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/);
});

test('Deploy rebuilds the validated tree but does not repeat pre-merge check and test suites', async () => {
  const workflow = await read('.github/workflows/deploy.yml');

  assert.match(workflow, /push:[\s\S]*branches:[\s\S]*- main/);
  assert.match(workflow, /cache:\s*npm/);
  assert.doesNotMatch(workflow, /- name: Check project/);
  assert.doesNotMatch(workflow, /run:\s*npm run check/);
  assert.doesNotMatch(workflow, /- name: Run tests/);
  assert.doesNotMatch(workflow, /run:\s*npm test/);
  assert.match(workflow, /- name: Build site/);
  assert.match(workflow, /Verify build outputs/);
  assert.match(workflow, /Prune inactive releases before staging/);
  assert.match(workflow, /Guard production disk capacity/);
  assert.match(workflow, /Prepare immutable release/);
  assert.match(workflow, /npm ci --omit=dev --no-audit --no-fund/);
  assert.match(workflow, /ops\/backup-sqlite\.py/);
  assert.match(workflow, /Activate release with rollback/);
  assert.match(workflow, /Verify final production boundary with rollback/);
  assert.match(workflow, /rollback-release\.sh/);
  assert.match(workflow, /verify-production-contract\.sh/);
  assert.match(workflow, /Measure deployed footprint/);
});

test('Post-deploy observation remains independent from deployment activation', async () => {
  const workflow = await read('.github/workflows/production-observe.yml');

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /- Deploy aprendo/);
  assert.match(workflow, /Observe runtime and disk footprint/);
  assert.match(workflow, /Observe HTTPS boundary/);
});
