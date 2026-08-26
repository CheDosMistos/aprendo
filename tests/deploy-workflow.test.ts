import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');

test('deployment prunes only inactive releases before staging a new immutable release', () => {
  const pruneIndex = workflow.indexOf('- name: Prune inactive releases before staging');
  const prepareIndex = workflow.indexOf('- name: Prepare immutable release');

  assert.ok(pruneIndex >= 0, 'missing pre-staging release pruning step');
  assert.ok(prepareIndex > pruneIndex, 'inactive release pruning must happen before staging');
  assert.match(workflow, /active="\$\(readlink -f "\$current"\)"/);
  assert.match(workflow, /if \[ -n "\$active" \] && \[ "\$resolved" = "\$active" \]; then continue; fi/);
  assert.match(workflow, /rm -rf -- "\$candidate"/);
});
