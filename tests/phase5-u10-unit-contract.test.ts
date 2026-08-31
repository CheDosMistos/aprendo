import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const pagesRoot = path.resolve('src/courses/bateria/content/pages');
const notation = path.resolve('public/bateria/notation/f5/u10/f5-u10-meter-vs-grouping.musicxml');
const pages = { overview:'f5-u10-overview.md', l1:'f5-u10-l1-metrica-vs-agrupacion.md', l2:'f5-u10-l2-groove-7-8.md', l3:'f5-u10-l3-textura-4-4-332.md', l4:'f5-u10-l4-fill-retorno-complejidad.md' } as const;
async function page(key: keyof typeof pages) { return readFile(path.join(pagesRoot,pages[key]),'utf8'); }
function fm(markdown:string){ return markdown.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''; }
function plain(markdown:string){ return markdown.replace(/[*_`]/g,''); }

test('F5 U10 has overview and four lessons in order', async()=>{ for (const [order,key] of (Object.keys(pages) as (keyof typeof pages)[]).entries()) { const f=fm(await page(key)); assert.match(f,/^phase:\s*5$/m); assert.match(f,/^unit:\s*10$/m); assert.match(f,/^unitSlug:\s*fase-5-unidad-10$/m); assert.match(f,new RegExp(`^order:\\s*${order}$`,'m')); }});

test('overview separates meter, grouping, tuplets and advanced reserve', async()=>{ const t=plain(await page('overview')); assert.match(t,/COMPÁS IRREGULAR ≠ AGRUPACIÓN ASIMÉTRICA EN 4\/4/i); assert.match(t,/AGRUPACIÓN ≠ TUPLET/i); assert.match(t,/no crea por sí sola polimetría/i); assert.match(t,/no introduce modulación métrica/i); assert.match(t,/FUSION\/PROGRESSIVE ≠ COMPÁS IMPAR/i); assert.match(t,/No existe BPM de aprobado/i); });

test('L1 contrasts actual 7/8 with 3+3+2 inside 4/4 and embeds original score', async()=>{ const t=plain(await page('l1')); assert.match(t,/f5-u10-meter-vs-grouping\.musicxml/); assert.match(t,/4\/4 con 3\+3\+2/i); assert.match(t,/7\/8 con 2\+2\+3/i); assert.match(t,/AGRUPACIÓN ≠ TUPLET/i); });

test('L2 keeps 7/8 groove diagnostic and recoverable', async()=>{ const t=plain(await page('l2')); assert.match(t,/MÉTRICA NUEVA \+ COORDINACIÓN NUEVA = MAL DIAGNÓSTICO/i); assert.match(t,/1 2 \| 1 2 \| 1 2 3/i); assert.match(t,/un solo compás/i); assert.match(t,/recupera/i); assert.doesNotMatch(t,/BPM de aprobado/i); });

test('L3 keeps 3+3+2 in 4/4 distinct from odd meter and polymeter', async()=>{ const t=plain(await page('l3')); assert.match(t,/AGRUPACIÓN ASIMÉTRICA EN 4\/4 ≠ COMPÁS IRREGULAR/i); assert.match(t,/3\+3\+2 EN 4\/4 NO ES, POR SÍ SOLO, POLIMETRÍA/i); assert.match(t,/Tampoco es modulación métrica/i); });

test('L4 prioritizes fill return and separates metric from coordinative complexity', async()=>{ const t=plain(await page('l4')); assert.match(t,/COMPLEJIDAD MÉTRICA ≠ COMPLEJIDAD COORDINATIVA/i); assert.match(t,/FILL FUNCIONAL = FRASE \+ RETORNO/i); assert.match(t,/No hay checkpoint global nuevo/i); assert.match(t,/no existe BPM de aprobado/i); });

test('U10 notation is original, five-line, reference-tempo and metrically contrasts 4/4 with 7/8', async()=>{ const x=await readFile(notation,'utf8'); assert.match(x,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/); assert.match(x,/<staff-lines>5<\/staff-lines>/); assert.match(x,/<sound tempo="120"\/>/); assert.match(x,/<beats>4<\/beats><beat-type>4<\/beat-type>/); assert.match(x,/<beats>7<\/beats><beat-type>8<\/beat-type>/); assert.equal((x.match(/<measure number=/g)??[]).length,2); assert.doesNotMatch(x,/<time-modification>/); assert.match(x,/3\+3\+2/); assert.match(x,/2\+2\+3/); });
