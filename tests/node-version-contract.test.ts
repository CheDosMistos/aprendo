import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('development, package engine and workflows share the Node 24 contract', () => {
  const nvmVersion = readFileSync('.nvmrc', 'utf8').trim();
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { engines?: { node?: string } };
  const readme = readFileSync('README.md', 'utf8');
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');
  const browser = readFileSync('.github/workflows/browser-e2e.yml', 'utf8');

  assert.equal(nvmVersion, '24.15.0');
  assert.equal(packageJson.engines?.node, `>=${nvmVersion}`);
  assert.match(readme, /Node\.js 24\.15\.0 o superior/);
  assert.match(readme, /npm ci/);
  assert.doesNotMatch(readme, /npm install\b/);

  for (const [name, workflow] of [['ci', ci], ['deploy', deploy], ['browser-e2e', browser]] as const) {
    assert.match(workflow, /node-version:\s*['"]?24['"]?/, `${name} must use Node 24`);
  }
});
