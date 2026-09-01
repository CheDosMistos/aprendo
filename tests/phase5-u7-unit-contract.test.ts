import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notation = path.resolve('public/bateria/notation/f5/u7/f5-u7-one-drop-steppers.musicxml');
const pages = { overview:'f5-u7-overview.md', l1:'f5-u7-l1-offbeat-silencio-activo.md', l2:'f5-u7-l2-one-drop-funcion.md', l3:'f5-u7-l3-one-drop-steppers-textura.md', l4:'f5-u7-l4-textura-recuperacion-pieza-b.md' } as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot,pages[key]),'utf8'); }
function fm(markdown:string){ return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown:string){ return markdown.replace(/[*_`]/g,''); }

test('F5 U7 has overview and four lessons in order', async()=>{ for (const [order,key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) { const f=fm(await page(key)); assert.match(f,/^phase:\s*5$/m); assert.match(f,/^unit:\s*7$/m); assert.match(f,/^unitSlug:\s*fase-5-unidad-7$/m); assert.match(f,new RegExp(`^order:\\s*${order}$`,'m')); }});

test('overview keeps style as language rather than pattern', async()=>{ const t=plain(await page('overview')); assert.match(t,/tocar menos sin perder referencia ni intención/i); assert.match(t,/ESPACIO ≠ AUSENCIA DE PULSO/i); assert.match(t,/no reduciremos reggae/i); assert.match(t,/Pieza B conserva su identidad shuffle/i); assert.match(t,/No existe BPM de aprobado/i); });

test('L1 distinguishes offbeat from reggae identity', async()=>{ const t=plain(await page('l1')); assert.match(t,/OFFBEAT ≠ REGGAE/i); assert.match(t,/silencio/i); assert.match(t,/Yamaha Music/i); });

test('L2 uses an original one-drop pedagogical model with explicit boundary', async()=>{ const t=plain(await page('l2')); assert.match(t,/f5-u7-one-drop-steppers\.musicxml/); assert.match(t,/MODELO PEDAGÓGICO ≠ PATRÓN OFICIAL/i); assert.match(t,/tiempo 3/i); assert.match(t,/no pretende copiar/i); });

test('L3 contrasts one-drop and steppers while reserving rockers', async()=>{ const t=plain(await page('l3')); assert.match(t,/bombo a negras en los cuatro tiempos/i); assert.match(t,/A 4 compases → B 4 → A 4 → B 4/i); assert.match(t,/rockers/i); assert.match(t,/no la convierte en un tercer patrón obligatorio/i); });

test('L4 continues Piece B without style erasure', async()=>{ const t=plain(await page('l4')); assert.match(t,/NO CONVIERTAS PIEZA B EN REGGAE/i); assert.match(t,/Pieza B.*shuffle/is); assert.match(t,/no añade un checkpoint global/i); });

test('U7 notation is original, five-line, reference-tempo and contains two contrast measures', async()=>{ const x=await readFile(notation,'utf8'); assert.match(x,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/); assert.match(x,/<staff-lines>5<\/staff-lines>/); assert.match(x,/<sound tempo="120"\/>/); assert.equal((x.match(/<measure number=/g)??[]).length,2); assert.match(x,/modelo pedagógico one-drop/i); assert.match(x,/contraste steppers/i); const steppers=x.match(/<measure number="2">([\s\S]*?)<\/measure>/)?.[1] ?? ''; assert.equal((steppers.match(/instrument id="P1-I3"/g)??[]).length,4); });
