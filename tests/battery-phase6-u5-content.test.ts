import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u5-overview.md','f6-u5-l1-restriccion-eleccion.md','f6-u5-l2-laboratorio-funk-funk-jazz.md',
  'f6-u5-l3-laboratorio-bop-jazz.md','f6-u5-l4-grabar-escuchar-revisar.md','f6-u5-checkpoint-improvisacion-restricciones.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

test('Fase 6 U5 publica overview, cuatro lecciones y checkpoint',()=>{for(const d of docs){assert.match(d,/phase: 6\nunit: 5\nunitSlug: fase-6-unidad-5/);assert.match(d,/published: true/);}assert.match(docs[0],/4 lecciones \+ checkpoint/);});

test('U5 entrena selección bajo restricciones y revisión audible',()=>{assert.match(docs[0],/VOCABULARIO CONOCIDO → RESTRICCIÓN MUSICAL → ELECCIÓN → VARIACIÓN → ESCUCHA → AJUSTE/);assert.match(docs[1],/qué debe permanecer estable/i);assert.match(docs[4],/INTENCIÓN → TOMA → ESCUCHA → DIAGNÓSTICO → UNA REVISIÓN → RETEST/);assert.match(docs[5],/segunda toma/i);});

test('U5 mantiene laboratorios estilísticos como contexto, no como certificación',()=>{assert.match(docs[2],/no intenta resumir «el funk»/i);assert.match(docs[3],/No aprenderás aquí «el patrón correcto de jazz»/i);assert.match(docs[5],/no certifica dominio estilístico general/i);});

test('U5 respeta copyright y atribución',()=>{assert.match(docs[0],/no reproduce ejercicios de \*Future Sounds\*/i);assert.match(docs[2],/No se transcribe aquí ninguna parte protegida/i);assert.match(docs[3],/No reproduce, reconstruye ni adapta sus ejercicios/i);for(const d of docs.slice(1,5)){if(/EJERCICIO ORIGINAL/.test(d))assert.match(d,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);}});

test('U5 preserva fronteras de U6 U7 U8 Fase 7 e Hito 7',()=>{assert.match(docs[0],/interacción interpersonal explícita de U6/);assert.match(docs[0],/transferencia entre estilos.*U7/i);assert.match(docs[0],/feel\/microtiming de U8/);assert.match(docs[5],/polirritmia profunda, polimetría o modulación métrica de Fase 7/);assert.match(docs[5],/Hito 7/);assert.match(docs[5],/No existe BPM de aprobado/);});
