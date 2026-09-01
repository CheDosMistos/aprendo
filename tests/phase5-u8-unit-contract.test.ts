import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notation = path.resolve('public/bateria/notation/f5/u8/f5-u8-time-comping.musicxml');
const pages = { overview:'f5-u8-overview.md', l1:'f5-u8-l1-ride-swing-time.md', l2:'f5-u8-l2-hihat-pie-balance.md', l3:'f5-u8-l3-comping-elemental.md', l4:'f5-u8-l4-navegacion-forma-jazz.md' } as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot,pages[key]),'utf8'); }
function fm(markdown:string){ return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown:string){ return markdown.replace(/[*_`]/g,''); }

test('F5 U8 has overview and four lessons in order', async()=>{ for (const [order,key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) { const f=fm(await page(key)); assert.match(f,/^phase:\s*5$/m); assert.match(f,/^unit:\s*8$/m); assert.match(f,/^unitSlug:\s*fase-5-unidad-8$/m); assert.match(f,new RegExp(`^order:\\s*${order}$`,'m')); }});

test('overview protects jazz boundaries and selective Riley use', async()=>{ const t=plain(await page('overview')); assert.match(t,/TIME PRIMERO → RESPUESTA DESPUÉS/i); assert.match(t,/REJILLA TERNARIA ≠ SWING REAL COMPLETO/i); assert.match(t,/COMPING ≠ TOCAR MÁS/i); assert.match(t,/John Riley: recurso selectivo, no currículo/i); assert.match(t,/No existe BPM de aprobado/i); });

test('L1 distinguishes pedagogical triplet grid from real swing', async()=>{ const t=plain(await page('l1')); assert.match(t,/f5-u8-time-comping\.musicxml/); assert.match(t,/REJILLA TERNARIA ≠ SWING REAL COMPLETO/i); assert.match(t,/Friberg.*Sundström/is); assert.match(t,/swing ratio/i); });

test('L2 keeps foot hi-hat subordinate to ride time', async()=>{ const t=plain(await page('l2')); assert.match(t,/2.*4/is); assert.match(t,/EL PIE APOYA EL TIME; NO LO SUSTITUYE/i); assert.match(t,/H7 contextual/i); });

test('L3 defines comping as limited musical response, not density', async()=>{ const t=plain(await page('l3')); assert.match(t,/COMPING ≠ TOCAR MÁS/i); assert.match(t,/acompañamiento o conversación rítmica/i); assert.match(t,/H7 contextual/i); assert.match(t,/no requisitos/i); });

test('L4 navigates an original form without creating a checkpoint', async()=>{ const t=plain(await page('l4')); assert.match(t,/TIEMPO → FORMA → ENTRADA → FIGURE → DETALLE/i); assert.match(t,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/i); assert.match(t,/A — A — B — A/i); assert.match(t,/FORMA CONSERVADA > RESPUESTA PERFECTA/i); assert.match(t,/No hay checkpoint global nuevo/i); });

test('U8 notation is original, five-line, reference-tempo, triplet-grid and two measures', async()=>{ const x=await readFile(notation,'utf8'); assert.match(x,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/); assert.match(x,/<staff-lines>5<\/staff-lines>/); assert.match(x,/<sound tempo="120"\/>/); assert.match(x,/<divisions>12<\/divisions>/); assert.match(x,/<time-modification>/); assert.equal((x.match(/<measure number=/g)??[]).length,2); assert.match(x,/rejilla ternaria pedagógica/i); assert.match(x,/respuestas de caja preparadas/i); });
