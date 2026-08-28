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

test('Browser E2E uses a lean default while retaining a full-suite path for global changes', async () => {
  const workflow = await read('.github/workflows/e2e.yml');

  assert.match(workflow, /cache:\s*npm/);
  assert.match(workflow, /actions\/cache@v4/);
  assert.match(workflow, /playwright-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/);
  assert.match(workflow, /tests\/e2e\/aprendo\.spec\.ts/);
  assert.match(workflow, /tests\/e2e\/first-sight\.spec\.ts/);
  assert.match(workflow, /tests\/e2e\/battery-unit-cards\.spec\.ts/);
  assert.match(workflow, /npx playwright test --project=chromium-desktop/);
  assert.match(workflow, /High-risk\/global change detected: running the complete browser suite/);
  assert.match(workflow, /npm run test:e2e/);
  assert.match(workflow, /\.github\/workflows\/\*/);
  assert.match(workflow, /src\/platform\/\*/);
  assert.match(workflow, /src\/courses\/bateria\/components\/\*/);
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
