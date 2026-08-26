import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');

test('deployment prunes only inactive releases before staging a new immutable release', () => {
  const pruneIndex = workflow.indexOf('- name: Prune inactive releases before staging');
  const guardIndex = workflow.indexOf('- name: Guard production disk capacity');
  const prepareIndex = workflow.indexOf('- name: Prepare immutable release');

  assert.ok(pruneIndex >= 0, 'missing pre-staging release pruning step');
  assert.ok(guardIndex > pruneIndex, 'disk guard must run after inactive release pruning');
  assert.ok(prepareIndex > guardIndex, 'disk guard must run before staging');
  assert.match(workflow, /active="\$\(readlink -f "\$current"\)"/);
  assert.match(workflow, /if \[ -n "\$active" \] && \[ "\$resolved" = "\$active" \]; then continue; fi/);
  assert.match(workflow, /rm -rf -- "\$candidate"/);
});

test('deployment enforces explicit build, release and free-space budgets', () => {
  assert.match(workflow, /max_dist_kb=131072/);
  assert.match(workflow, /min_free_kb=1048576/);
  assert.match(workflow, /required_kb=\$\(\(active_kb \* 3\)\)/);
  assert.match(workflow, /max_release_kb=524288/);
  assert.match(workflow, /min_remaining_kb=524288/);
  assert.match(workflow, /npm_config_cache="\$release\/\.npm-cache"/);
  assert.match(workflow, /Cleaning failed staged release/);
});

test('final production verification automatically rolls back the activated release on failure', () => {
  const activateIndex = workflow.indexOf('- name: Activate release with rollback');
  const verifyIndex = workflow.indexOf('- name: Verify final production boundary with rollback');
  const measureIndex = workflow.indexOf('- name: Measure deployed footprint');

  assert.ok(activateIndex >= 0, 'missing release activation');
  assert.ok(verifyIndex > activateIndex, 'final verification must happen after activation');
  assert.ok(measureIndex > verifyIndex, 'footprint measurement must happen after final verification');
  assert.match(workflow, /ops\/rollback-release\.sh/);
  assert.match(workflow, /trap rollback_final ERR/);
  assert.match(workflow, /bash \/tmp\/rollback-release\.sh \$RELEASE_SHA/);
  assert.match(workflow, /bash \/tmp\/verify-production-contract\.sh/);
  assert.match(workflow, /https:\/\/aprendo\.molacomer\.com\/bateria\/notation\/u1\/lectura-diagnostico-a1-a2\.musicxml/);
});
