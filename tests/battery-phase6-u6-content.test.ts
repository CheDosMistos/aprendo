import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u6-overview.md','f6-u6-l1-escucha-bajo-forma-funcion.md','f6-u6-l2-cues-responder-continuar.md',
  'f6-u6-l3-densidad-dinamica-arreglo.md','f6-u6-l4-call-response-interaccion-real.md','f6-u6-checkpoint-i6-interaccion.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

test('Fase 6 U6 publica overview, cuatro lecciones y Checkpoint 6C',()=>{for(const d of docs){assert.match(d,/phase: 6\nunit: 6\nunitSlug: fase-6-unidad-6/);assert.match(d,/published: true/);}assert.match(docs[0],/4 lecciones \+ checkpoint/);assert.match(docs[5],/Checkpoint 6C/);});

test('U6 enseña escuchar interpretar decidir modificar y mantener música',()=>{assert.match(docs[0],/ESCUCHAR INFORMACIÓN EXTERNA → INTERPRETAR SU FUNCIÓN → DECIDIR → MODIFICAR LA EJECUCIÓN → MANTENER LA MÚSICA → EVALUAR LA RESPUESTA/);assert.match(docs[1],/coincidir.*complementar.*mantener/is);assert.match(docs[2],/DETECTAR → COMPRENDER FUNCIÓN → DECIDIR → RESPONDER → CONTINUAR LA FORMA/);assert.match(docs[3],/mantener.*reducir.*reforzar.*preparar/is);});

test('U6 no reduce interacción a bombo=bajo ni a tocar sobre una pista',()=>{assert.match(docs[0],/no existe una regla general “bombo = bajo”/i);assert.match(docs[0],/pista fija ≠ compañero adaptativo/i);assert.match(docs[4],/sorpresa programada con reciprocidad/i);assert.match(docs[5],/no basta para afirmar interacción interpersonal completa/i);});

test('U6 separa evidencia simulada de reciprocidad interpersonal',()=>{assert.match(docs[0],/simulación programada/i);assert.match(docs[4],/adaptación bidireccional/i);assert.match(docs[4],/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/);assert.match(docs[5],/I6 MÍNIMO robusto/);});

test('U6 usa material original y respeta fronteras curriculares',()=>{for(const d of docs.slice(1,6)){if(/EJERCICIO ORIGINAL/.test(d))assert.match(d,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);}assert.match(docs[0],/U7/);assert.match(docs[0],/U8/);assert.match(docs[0],/U10/);assert.match(docs[5],/no declara Hito 7/i);assert.match(docs[5],/No existe BPM|no usa BPM universal/i);});

test('Checkpoint 6C conserva niveles aprobados sin rúbrica paralela',()=>{assert.match(docs[5],/MÍNIMO PARA AVANZAR — I6/);assert.match(docs[5],/COMPETENTE \/ FUNCIONAL/);assert.match(docs[5],/AVANZADO/);assert.match(docs[5],/CONTINUAR/);assert.match(docs[5],/CONTINUAR \+ CORRECTIVO/);assert.match(docs[5],/REDUCIR NOVEDAD/);assert.match(docs[5],/No se promedian estas dimensiones como nota numérica/i);});
