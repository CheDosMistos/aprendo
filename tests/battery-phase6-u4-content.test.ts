import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u4-overview.md','f6-u4-l1-verificar-p6-cuello-botella.md','f6-u4-l2-ostinato-voz-variable.md',
  'f6-u4-l3-desplazar-funcion.md','f6-u4-l4-del-sistema-a-la-musica.md','f6-u4-checkpoint-independencia-funcional.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

test('Fase 6 U4 publica overview, cuatro lecciones y checkpoint',()=>{for(const d of docs){assert.match(d,/phase: 6\nunit: 4\nunitSlug: fase-6-unidad-4/);assert.match(d,/published: true/);}assert.match(docs[0],/4 lecciones \+ checkpoint/);});

test('U4 respeta P6 antes de profundizar H7',()=>{assert.match(docs[0],/H4 FUNCIONAL/);assert.match(docs[0],/C2 FUNCIONAL/);assert.match(docs[0],/ostinato básico mantenido sin colapso de tiempo/);assert.match(docs[1],/Ruta si P6 no está abierta/);});

test('U4 subordina sistemas de coordinación a una función musical',()=>{assert.match(docs[0],/FUNCIÓN MUSICAL → CUELLO DE BOTELLA → COMPETENCIA/);assert.match(docs[4],/FUNCIÓN MUSICAL → CUELLO DE BOTELLA → EJERCICIO SELECCIONADO → RECOMBINACIÓN → RETEST EN MÚSICA/);assert.match(docs[4],/no reproduce ejercicios protegidos/i);});

test('U4 mantiene las fronteras conceptuales con Fase 7',()=>{assert.match(docs[3],/No es polimetría ni modulación métrica/);assert.match(docs[5],/NO certifica/);assert.match(docs[5],/polirritmia profunda/);assert.match(docs[5],/Hito 7/);assert.match(docs[5],/No existe BPM de aprobado/);});
