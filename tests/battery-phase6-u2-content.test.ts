import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = 'src/courses/bateria/content/pages';
const files = {
  overview: `${base}/f6-u2-overview.md`,
  l1: `${base}/f6-u2-l1-pulso-mapa-formal.md`,
  l2: `${base}/f6-u2-l2-subdivision-groove-funcional.md`,
  l3: `${base}/f6-u2-l3-articulacion-dinamica-certeza.md`,
  l4: `${base}/f6-u2-l4-contrastar-corregir-documentar.md`,
  checkpoint: `${base}/f6-u2-checkpoint-transcripcion-funcional.md`,
} as const;

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]),
) as Record<keyof typeof files, string>;

test('Fase 6 U2 publica overview, cuatro lecciones y Checkpoint 6A con metadatos coherentes', () => {
  for (const [key, content] of Object.entries(text)) {
    assert.match(content, /^---\n[\s\S]*\nphase: 6\nunit: 2\nunitSlug: fase-6-unidad-2\n/m, key);
    assert.match(content, /published: true/, key);
  }
  assert.match(text.overview, /duration: Unidad flexible · 4 lecciones \+ checkpoint/);
  assert.match(text.checkpoint, /Checkpoint 6A — Transcripción funcional/);
});

test('U2 conserva la jerarquía de escucha aprobada y la política de incertidumbre', () => {
  assert.match(text.overview, /PULSO → FORMA → MÉTRICA\/SUBDIVISIÓN → FUNCIÓN DE GROOVE → ARTICULACIÓN\/DINÁMICA → DETALLE → VERIFICACIÓN/);
  assert.match(text.l3, /HECHO VERIFICADO/);
  assert.match(text.l3, /HIPÓTESIS DE ESCUCHA/);
  assert.match(text.l3, /APROXIMACIÓN DIDÁCTICA/);
  assert.match(text.l3, /NO DETERMINADO/);
  assert.match(text.checkpoint, /lo incierto permanece explícito/);
});

test('U2 no presenta reconstrucciones propias como partituras oficiales ni inventa atribuciones', () => {
  assert.match(text.overview, /Una reconstrucción propia \*\*no se presenta como partitura oficial\*\*/);
  assert.match(text.l3, /no atribuirlo al baterista sin evidencia/i);
  assert.match(text.l4, /fuentes legales y claramente identificadas/i);
  assert.match(text.checkpoint, /no inventes una fuente/i);
});

test('Checkpoint 6A certifica sólo E6 mínimo y no adelanta Hito 7', () => {
  assert.match(text.checkpoint, /E6 MÍNIMO en una tarea preparada/);
  assert.match(text.checkpoint, /NO certifica/);
  assert.match(text.checkpoint, /E6 FUNCIONAL en cualquier contexto/);
  assert.match(text.checkpoint, /Hito 7 — Aprendiz autónomo/);
  assert.match(text.checkpoint, /No existe BPM de aprobado/);
});
