import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u7-overview.md','f6-u7-l1-invariantes-rasgos-idiomaticos.md','f6-u7-l2-transferencia-controlada.md',
  'f6-u7-l3-contraste-familias-estilisticas.md','f6-u7-l4-hibridos-intencion-trazabilidad.md','f6-u7-checkpoint-i5-transferencia-estilos.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U7 publica overview, cuatro lecciones y Checkpoint 6D',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 7\nunitSlug: fase-6-unidad-7/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.match(docs[0],/4 lecciones \+ checkpoint/);
  assert.match(docs[5],/Checkpoint 6D/);
});

test('U7 mantiene I5 como novedad dominante y respeta sus dependencias',()=>{
  assert.match(frontmatter(docs[0]),/competencies: \[I5, I2, I1, F7, G2, G3, H5, H6, E5, C1, C2\]/);
  assert.match(docs[0],/Dependencias superiores: `I2-R, F7-F, G2-F`/);
  assert.match(docs[0],/MÍNIMO PARA AVANZAR: identifica un principio compartido entre estilos/i);
});

test('U7 distingue principio compartido, realización y rasgo idiomático',()=>{
  assert.match(docs[0],/Principio compartido ≠ patrón idéntico/i);
  assert.match(docs[1],/FUNCIÓN.*REALIZACIÓN/is);
  assert.match(docs[1],/NO DETERMINADO/);
  assert.match(docs[5],/distingues ese principio de su realización concreta/i);
});

test('U7 enseña transferencia controlada y diagnosticable',()=>{
  assert.match(docs[0],/IDENTIFICAR PRINCIPIO COMPARTIDO → SEPARAR RASGO IDIOMÁTICO → TRANSFERIR UNA VARIABLE/);
  assert.match(docs[2],/CONSERVA UNA FUNCIÓN → CAMBIA UNA VARIABLE → ESCUCHA EL EFECTO/);
  assert.match(docs[2],/TRANSFERENCIA ÚTIL/);
  assert.match(docs[2],/TRANSFERENCIA PARCIAL/);
  assert.match(docs[2],/TRANSFERENCIA FALLIDA/);
});

test('U7 evita caricaturizar estilos y atribuir material original',()=>{
  assert.match(docs[1],/Una grabación es .*un ejemplo dentro de una tradición/is);
  assert.match(docs[3],/NO pretende dominar esa lista/i);
  assert.match(docs[3],/No atribuyas una célula propia a una tradición histórica/i);
  for(const d of docs.slice(1,6)){if(/EJERCICIO ORIGINAL/.test(d))assert.match(d,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);}
});

test('U7 abre híbridos sin convertirlos en requisito mínimo',()=>{
  assert.match(docs[4],/combinar lenguajes y crear híbridos con intención musical/i);
  assert.match(docs[4],/No necesitas alcanzar todavía el nivel AVANZADO de I5/i);
  assert.match(docs[5],/Híbrido opcional/i);
  assert.match(docs[5],/no es requisito para demostrar MÍNIMO/i);
});

test('U7 documenta fuentes y mantiene fronteras U8 U10 Fase 7 e Hito 7',()=>{
  assert.match(docs[0],/Berklee College of Music/);
  assert.match(docs[0],/Hudson Music/);
  assert.match(docs[0],/U8/);
  assert.match(docs[0],/U10/);
  assert.match(docs[0],/Fase 7/);
  assert.match(docs[5],/no declara Hito 7/i);
  assert.match(docs[5],/no usa BPM universal/i);
});

test('Checkpoint 6D conserva niveles aprobados sin rúbrica paralela',()=>{
  assert.match(docs[5],/MÍNIMO PARA AVANZAR — I5/);
  assert.match(docs[5],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[5],/AVANZADO/);
  assert.match(docs[5],/CONTINUAR/);
  assert.match(docs[5],/CONTINUAR \+ CORRECTIVO/);
  assert.match(docs[5],/REDUCIR NOVEDAD/);
  assert.match(docs[5],/No se promedian estas dimensiones como nota numérica/i);
});
