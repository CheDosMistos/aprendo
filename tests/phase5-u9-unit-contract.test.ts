import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const pages = { overview:'f5-u9-overview.md', l1:'f5-u9-l1-procedencia-funcion-fuente.md', l2:'f5-u9-l2-samba-capas-kit.md', l3:'f5-u9-l3-clave-capas-afrocubanas.md', l4:'f5-u9-l4-transferencia-comparada.md' } as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot,pages[key]),'utf8'); }
function fm(markdown:string){ return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown:string){ return markdown.replace(/[*_`]/g,''); }

test('F5 U9 has overview and four lessons in order', async()=>{ for (const [order,key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) { const f=fm(await page(key)); assert.match(f,/^phase:\s*5$/m); assert.match(f,/^unit:\s*9$/m); assert.match(f,/^unitSlug:\s*fase-5-unidad-9$/m); assert.match(f,new RegExp(`^order:\\s*${order}$`,'m')); }});

test('overview rejects generic Latin and explains why no local idiomatic score is fabricated', async()=>{ const t=plain(await page('overview')); assert.match(t,/BRAZILIAN ≠ AFRO-CUBAN ≠ “LATIN GENÉRICO”/i); assert.match(t,/categoría paraguas/i); assert.match(t,/Por qué no hay una partitura local “latina”/i); assert.match(t,/NO ES UN PATRÓN TRADICIONAL NI UNA TRANSCRIPCIÓN/i); assert.match(t,/No existe BPM de aprobado/i); });

test('L1 requires provenance and source before transfer', async()=>{ const t=plain(await page('l1')); assert.match(t,/Procedencia antes que patrón/i); assert.match(t,/¿De qué tradición concreta procede\?/i); assert.match(t,/dato que no puedes afirmar aún/i); assert.match(t,/Brazilian Rhythms for Drumset/i); assert.match(t,/Afro-Cuban Rhythms for Drumset/i); });

test('L2 labels its samba layer lab as original but not authentic samba', async()=>{ const t=plain(await page('l2')); assert.match(t,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/i); assert.match(t,/NO ES UN PATRÓN DE SAMBA AUTÉNTICO/i); assert.match(t,/LABORATORIO DE CAPAS ≠ GROOVE DE SAMBA/i); assert.match(t,/surdo/i); assert.match(t,/caixa/i); });

test('L3 learns clave from external verified source and keeps neutral layer separate', async()=>{ const t=plain(await page('l3')); assert.match(t,/2-3 son clave/i); assert.match(t,/CLAVE ≠ ADORNO RÍTMICO/i); assert.match(t,/Berklee PULSE/i); assert.match(t,/Aprendo no reconstruye aquí la partitura/i); assert.match(t,/no se presenta como tumbao, cáscara ni patrón de mambo/i); });

test('L4 compares without hybridizing and closes U9 without checkpoint', async()=>{ const t=plain(await page('l4')); assert.match(t,/TRANSFERIR ≠ MEZCLAR/i); assert.match(t,/Brazilian termina — Afro-Cuban empieza/i); assert.match(t,/no fusiona los dos idiomas/i); assert.match(t,/No hay checkpoint global nuevo/i); assert.match(t,/no existe BPM de aprobado/i); });

test('U9 intentionally contains no local notation embed', async()=>{ for (const key of Object.keys(pages) as (keyof typeof pages)[]) { const t=await page(key); assert.doesNotMatch(t,/data-notation-score/); assert.doesNotMatch(t,/\.musicxml/); } });
