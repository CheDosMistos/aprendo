import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('login keeps its visual error while announcing a textual error to assistive technology', () => {
  const source = readFileSync('src/pages/login.astro', 'utf8');
  assert.match(source, /class="auth-error" aria-hidden="true">×<\/span>/);
  assert.match(source, /class="auth-error-message" role="alert">Usuario o contraseña incorrectos\.<\/span>/);
});

test('home account link keeps an accessible name after avatar replacement', () => {
  const source = readFileSync('src/platform/layouts/HomeLayout.astro', 'utf8');
  const ariaIndex = source.indexOf("avatarButton.setAttribute('aria-label', 'Mi cuenta')");
  const replaceIndex = source.indexOf('avatarButton.replaceChildren(image)');
  assert.notEqual(ariaIndex, -1);
  assert.notEqual(replaceIndex, -1);
  assert.ok(ariaIndex < replaceIndex);
});

test('metronome global shortcuts ignore interactive controls including nested button content', () => {
  const source = readFileSync('src/platform/components/MetronomeCompact.astro', 'utf8');
  assert.match(source, /target\?\.closest\('input, select, textarea, button, a\[href\], \[contenteditable\], \[role="button"\], \[role="link"\]'\)/);
  assert.match(source, /if\(interactive\)return;/);
});
