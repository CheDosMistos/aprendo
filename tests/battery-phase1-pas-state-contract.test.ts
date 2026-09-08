import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const base = 'src/courses/bateria/content/pages';
const phase1Docs = readdirSync(base)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({ name, source: readFileSync(`${base}/${name}`, 'utf8') }))
  .filter(({ source }) => /^phase:\s*1$/m.test(source));

const read = (name: string) => readFileSync(`${base}/${name}`, 'utf8');

test('Fase 1 no publica INTRODUCIDO como cuarto estado PAS', () => {
  assert.ok(phase1Docs.length > 0, 'Debe existir contenido publicado de Fase 1');
  const offenders = phase1Docs
    .filter(({ source }) => /\bINTRODUCIDO\b/.test(source))
    .map(({ name }) => name);

  assert.deepEqual(
    offenders,
    [],
    `Estos archivos no deben presentar INTRODUCIDO como estado PAS: ${offenders.join(', ')}`,
  );
});

test('Fase 1 separa estados PAS de adquisición como modo de trabajo', () => {
  const contractDocs = [
    'u2-overview.md',
    'u3-overview.md',
    'u4-checkpoint.md',
    'u4-overview.md',
    'u5-overview.md',
    'u8-l3-double-ratamacue-7-8.md',
  ].map(read);

  for (const source of contractDocs) assert.match(source, /en adquisición/i);
  assert.match(contractDocs[2], /`CONOCIDO`, `FUNCIONAL` o `DOMINADO`/);
  assert.match(contractDocs[2], /modo de trabajo, no un cuarto estado PAS/);
});
