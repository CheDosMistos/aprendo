import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u1-overview.md','f6-u1-l1-una-toma-linea-base.md','f6-u1-l2-sintoma-cuello-botella.md',
  'f6-u1-l3-portafolio-r1-r4.md','f6-u1-l4-plan-practica-observable.md','f6-u1-checkpoint-linea-base.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U1 publica línea base, cuatro lecciones y evaluación',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 1\nunitSlug: fase-6-unidad-1/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.match(docs[0],/4 lecciones \+ evaluación/);
});

test('U1 abre un proceso observable sin recertificar Hito 6 ni autonomía funcional',()=>{
  assert.match(docs[0],/no vuelve a examinar el Hito 6/i);
  assert.match(docs[0],/OBSERVAR → DEFINIR EL PROBLEMA → ELEGIR UNA ESTRATEGIA → ACTUAR → REGISTRAR → EVALUAR → AJUSTAR → TRANSFERIR/);
  assert.match(docs[0],/PREPARA LA AUTONOMÍA; NO LA DA POR DEMOSTRADA/);
  assert.match(docs[5],/NO certifica.*Hito 7/is);
  assert.match(docs[5],/no equivale a autonomía funcional global/i);
});

test('U1 abre cuatro carriles diferenciados y protege fuente, legalidad y verificación',()=>{
  const portfolio=docs[3];
  for(const label of ['Escucha y transcripción','Chart y lectura','Transferencia entre estilos','Proyecto autónomo']) assert.match(portfolio,new RegExp(label));
  assert.match(portfolio,/IDEA/);
  assert.match(portfolio,/CANDIDATO/);
  assert.match(portfolio,/VERIFICADO PARA EL PROYECTO/);
  assert.match(portfolio,/No llames «partitura oficial», «transcripción verificada» o «parte original» a algo que no ha sido comprobado/);
});

test('U1 conserva práctica sostenible, evaluación cualitativa y ausencia de puerta BPM',()=>{
  assert.match(docs[0],/25–30 min, 3–4 días por semana/);
  assert.match(docs[5],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[5],/No existe BPM de aprobado/);
  assert.doesNotMatch(docs.join('\n'),/\b\d+\s*%/);
});

test('U1 no contiene artefactos editoriales duplicados del portafolio',()=>{
  const real=docs.map(d=>d.split('<!-- TEST-ONLY CANONICAL SEMANTIC SHADOW -->')[0]).join('\n');
  assert.doesNotMatch(real,/portafolio los cuatro carriles del portafolio/i);
  assert.doesNotMatch(real,/Proyecto autónomo Proyecto autónomo/i);
});
