import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('homepage links every existing user-facing destination', () => {
  assert.match(source, /class="avatar-button" href="\/cuenta\/"/);
  assert.match(source, /class="tool-card" href="\/bateria\/progreso\/"[\s\S]*?<strong>Mi progreso<\/strong>/);
});

test('homepage keeps only unavailable destinations inactive', () => {
  const inactiveAnchors = source.match(/<a class="[^"]*inactive-link[^"]*" href="#" aria-disabled="true"[^>]*>/g) ?? [];
  assert.equal(inactiveAnchors.length, 2);
  assert.match(source, /inactive-link" href="#" aria-disabled="true" title="Notificaciones no disponibles"/);
  assert.match(source, /class="tool-card inactive-link" href="#" aria-disabled="true">[\s\S]*?<strong>Práctica<\/strong>/);
});
