import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesDir = path.resolve('src/courses/bateria/content/pages');

function frontmatter(markdown: string): string {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function field(data: string, name: string): string {
  return data.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'))?.[1]?.trim() ?? '';
}

function competencies(data: string): string[] {
  const raw = field(data, 'competencies');
  return raw.replace(/^\[/, '').replace(/\]$/, '').split(',').map((value) => value.trim()).filter(Boolean);
}

async function phase2Pages(): Promise<Map<string, string>> {
  const names = (await readdir(pagesDir))
    .filter((name) => /^f2-u\d+-.*\.md$/.test(name))
    .sort();
  const docs = new Map<string, string>();
  for (const name of names) docs.set(name, await readFile(path.join(pagesDir, name), 'utf8'));
  return docs;
}

function requirePage(docs: Map<string, string>, name: string): string {
  const markdown = docs.get(name);
  assert.ok(markdown, `Missing Phase 2 page: ${name}`);
  return markdown;
}

test('Phase 2 has exactly twelve complete units with overview, four lessons and checkpoint', async () => {
  const docs = await phase2Pages();
  assert.equal(docs.size, 72, 'Phase 2 must contain 12 units × 6 pages');

  for (let unit = 1; unit <= 12; unit += 1) {
    const prefix = `f2-u${unit}-`;
    const unitEntries = [...docs.entries()].filter(([name]) => name.startsWith(prefix));
    assert.equal(unitEntries.length, 6, `U${unit} must contain exactly six pages`);

    const records = unitEntries.map(([name, markdown]) => {
      const data = frontmatter(markdown);
      assert.ok(data, `${name} must have frontmatter`);
      assert.equal(field(data, 'phase'), '2', `${name} must remain in Phase 2`);
      assert.equal(field(data, 'unit'), String(unit), `${name} has wrong unit number`);
      assert.equal(field(data, 'unitSlug'), `fase-2-unidad-${unit}`, `${name} has wrong unitSlug`);
      return { name, data, kind: field(data, 'kind'), order: Number(field(data, 'order')), contentId: field(data, 'contentId') };
    });

    assert.deepEqual(records.map((record) => record.order).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5], `U${unit} must expose orders 0–5 exactly once`);
    assert.equal(records.filter((record) => record.kind === 'unit').length, 1, `U${unit} needs one unit overview`);
    assert.equal(records.filter((record) => record.kind === 'lesson').length, 4, `U${unit} needs four lessons`);
    assert.equal(records.filter((record) => record.kind === 'checkpoint').length, 1, `U${unit} needs one checkpoint`);

    const overview = records.find((record) => record.order === 0);
    const checkpoint = records.find((record) => record.order === 5);
    assert.equal(overview?.kind, 'unit', `U${unit} order 0 must be the overview`);
    assert.equal(checkpoint?.kind, 'checkpoint', `U${unit} order 5 must be the checkpoint`);
    assert.match(checkpoint?.contentId ?? '', /-check$/, `U${unit} checkpoint contentId must use the -check schema contract`);
  }
});

test('Phase 2 preserves the approved metric and notation progression', async () => {
  const docs = await phase2Pages();
  const u5 = requirePage(docs, 'f2-u5-l1-tres-partes-mismo-pulso.md');
  const u6 = requirePage(docs, 'f2-u6-l1-dos-pulsos-tres-subdivisiones.md');
  const u7l1 = requirePage(docs, 'f2-u7-l1-9-8-tres-pulsos-compuestos.md');
  const u7l2 = requirePage(docs, 'f2-u7-l2-12-8-cuatro-pulsos-compuestos.md');
  const u8l1 = requirePage(docs, 'f2-u8-l1-sextillo-escrito-seis-en-tiempo-de-cuatro.md');
  const u8l2 = requirePage(docs, 'f2-u8-l2-flam-escrito-grace-note-y-principal.md');
  const u8l3 = requirePage(docs, 'f2-u8-l3-drag-escrito-double-grace-y-principal.md');
  const u8l4 = requirePage(docs, 'f2-u8-l4-roll-escrito-duracion-y-repeticion.md');

  assert.match(u5, /tres partes|subdivisi[oó]n ternaria/i, 'U5 must establish ternary subdivision before compound meter');
  assert.match(u6, /6\/8/, 'U6 must establish 6/8 before 9/8 and 12/8');
  assert.match(u6, /2\s*(?:×|x)\s*3|dos pulsos.*tres subdivisiones/is);
  assert.match(u7l1, /9\/8/);
  assert.match(u7l1, /3\s*(?:×|x)\s*3|tres pulsos.*tres subdivisiones/is);
  assert.match(u7l2, /12\/8/);
  assert.match(u7l2, /4\s*(?:×|x)\s*3|cuatro pulsos.*tres subdivisiones/is);
  assert.match(u8l1, /sextillo/i);
  assert.match(u8l2, /flam|grace note/i);
  assert.match(u8l3, /drag|double grace/i);
  assert.match(u8l4, /roll/i);
});

test('Formal D5 begins in U9 while earlier new-reading work remains a spiral window', async () => {
  const docs = await phase2Pages();

  for (const [name, markdown] of docs) {
    const match = /^f2-u(\d+)-/.exec(name);
    const unit = Number(match?.[1] ?? 0);
    if (unit >= 9) continue;
    assert.ok(!competencies(frontmatter(markdown)).includes('D5'), `${name} assigns D5 before its formal U9 introduction`);
  }

  const u1Window = requirePage(docs, 'f2-u1-l4-oido-escritura-primera-vista.md');
  assert.match(u1Window, /VENTANA CURRICULAR/);
  assert.match(u1Window, /No se registra todavía como evidencia formal D5/i);
  assert.match(u1Window, /U9.*(?:introduce|introducir).*formalmente D5|D5.*(?:introduce|introducir).*formalmente.*U9/i);
  assert.match(u1Window, /data-score-first-sight="true"/, 'Early new-reading window should remain technically protected');

  const u9 = requirePage(docs, 'f2-u9-overview.md');
  assert.ok(competencies(frontmatter(u9)).includes('D5'), 'U9 overview must formally assign D5');
  assert.match(u9, /U9 introduce una condici[oó]n distinta/i);
  assert.match(u9, /objetivo central es \*\*D5/i);
  assert.match(u9, /Hito 2 completo.*cierre de Fase 2/is);
});

test('Every protected first-sight score is exclusive to one Phase 2 page', async () => {
  const docs = await phase2Pages();
  const owners = new Map<string, Set<string>>();

  for (const [name, markdown] of docs) {
    const tags = [...markdown.matchAll(/<div\s+[^>]*data-notation-score[^>]*data-score-first-sight="true"[^>]*>/g)];
    for (const tag of tags) {
      const src = tag[0].match(/data-score-src="([^"]+)"/)?.[1];
      assert.ok(src, `${name} has protected first-sight markup without data-score-src`);
      const pages = owners.get(src) ?? new Set<string>();
      pages.add(name);
      owners.set(src, pages);
    }
  }

  assert.ok(owners.size >= 5, 'Phase 2 should contain multiple independent protected first-sight samples');
  for (const [src, pages] of owners) {
    assert.equal(pages.size, 1, `${src} is reused as protected first-sight evidence across multiple pages: ${[...pages].join(', ')}`);
  }

  const u12Checkpoint = requirePage(docs, 'f2-u12-checkpoint-hito-2.md');
  for (const src of [
    '/bateria/notation/f2/u12/f2-u12-check-muestra-c-4-4.musicxml',
    '/bateria/notation/f2/u12/f2-u12-check-muestra-d-6-8.musicxml',
  ]) {
    assert.match(u12Checkpoint, new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const pagesContaining = [...docs.entries()].filter(([, markdown]) => markdown.includes(src)).map(([name]) => name);
    assert.deepEqual(pagesContaining, ['f2-u12-checkpoint-hito-2.md'], `${src} must remain exclusive to the Hito 2 checkpoint`);
  }
});

test('Late Phase 2 keeps reduced reference, integration and Hito 2 as distinct curricular problems', async () => {
  const docs = await phase2Pages();
  const u10 = requirePage(docs, 'f2-u10-overview.md');
  const u11 = requirePage(docs, 'f2-u11-overview.md');
  const u12 = requirePage(docs, 'f2-u12-checkpoint-hito-2.md');

  assert.match(u10, /lectura utilizada debe ser deliberadamente conocida y controlada/i);
  assert.match(u10, /primera vista como dificultad central.*U9/is);
  assert.ok(!competencies(frontmatter(u10)).includes('D5'), 'U10 must isolate reduced-reference timing rather than retest formal D5');
  assert.match(u10, /Completar U10 no convierte automáticamente C5 en `FUNCIONAL`/);

  assert.match(u11, /cambiar de representaci[oó]n sin perder la estructura r[ií]tmica/i);
  assert.match(u11, /no crea un segundo Hito 2/i);
  assert.match(u11, /E6 transcripci[oó]n estructurada extensa no es foco/i);
  assert.match(u11, /5\/4, 7\/8, quintillos y 3:2 son s[oó]lo ventanas opcionales/i);

  assert.match(u12, /Leer y reproducir material r[ií]tmico nuevo sin depender de que el patr[oó]n haya sido previamente memorizado/);
  for (const dimension of ['pulso y subdivisión', 'continuidad', 'precisión de ataques, silencios y duraciones', 'recuperación tras error localizado', 'comprensión suficiente']) {
    assert.match(u12, new RegExp(dimension));
  }
  assert.match(u12, /BPM y click son condiciones de la tarea/);
  assert.match(u12, /no convierte automáticamente C1–C3, D1–D5 o F1–F2 en FUNCIONALES/i);
  assert.match(u12, /Fase 3 gana el centro de gravedad/i);
});

test('Listening and writing recur across Phase 2 instead of appearing as a one-off block', async () => {
  const docs = await phase2Pages();
  const recurringPages = [
    'f2-u2-l3-oir-imitar-escribir.md',
    'f2-u3-l4-oir-escribir-transformar-duracion.md',
    'f2-u5-l4-oir-escribir-transferir.md',
    'f2-u7-l4-leer-escuchar-clasificar-y-explicar.md',
    'f2-u11-l1-escuchar-escribir-tocar-comparar.md',
    'f2-u12-l4-diagnostico-y-puente-f3.md',
  ];

  for (const name of recurringPages) {
    const markdown = requirePage(docs, name);
    assert.match(markdown, /escuch|o[ií]r|dictado|data-rhythm-dictation/i, `${name} must contain auditory work`);
    assert.match(markdown, /escri|representa|anota/i, `${name} must connect hearing to a representation`);
  }
});