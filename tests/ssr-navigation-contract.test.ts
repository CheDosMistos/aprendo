import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('battery dynamic pages resolve content from SSR params and return 404 for unknown routes', async () => {
  const [unitPage, sessionPage] = await Promise.all([
    read('src/pages/bateria/[unit]/index.astro'),
    read('src/pages/bateria/[unit]/[slug].astro'),
  ]);

  for (const source of [unitPage, sessionPage]) {
    assert.doesNotMatch(source, /getStaticPaths/);
    assert.match(source, /Astro\.params/);
    assert.match(source, /status:\s*404/);
  }
});

test('the linked Unit 1 diagnostic is real published content', async () => {
  const diagnostic = await read('src/courses/bateria/content/pages/u1-s0-diagnostico.md');
  assert.match(diagnostic, /slug:\s*sesion-0-diagnostico/);
  assert.match(diagnostic, /published:\s*true/);
});

test('home header circular controls have a definitive border override', async () => {
  const layout = await read('src/platform/layouts/HomeLayout.astro');
  assert.match(layout, /\.home-header \.icon-button[\s\S]*\.home-header \.avatar-button[\s\S]*border:\s*0\s*!important;/);
});
