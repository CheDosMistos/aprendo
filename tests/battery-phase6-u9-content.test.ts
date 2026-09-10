import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u9-overview.md','f6-u9-l1-del-sintoma-a-la-estrategia.md','f6-u9-l2-calibracion-grabacion-feedback.md',
  'f6-u9-l3-ayudas-con-proposito.md','f6-u9-l4-microciclo-autonomo.md','f6-u9-checkpoint-k8-autonomia-funcional.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U9 publica el proyecto de repertorio y corresponde a Checkpoint 6E',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 9\nunitSlug: fase-6-unidad-9/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.match(docs[5],/Checkpoint 6E — Repertorio aprendido mediante escucha, transcripción y análisis/);
  assert.doesNotMatch(docs[5],/Checkpoint 6F/);
});

test('U9 restaura el hito específico de Fase 6 y no lo sustituye por autonomía',()=>{
  assert.match(docs[0],/Aprender una pieza al menos parcialmente mediante escucha, transcripción y análisis, no únicamente mediante tutorial/);
  assert.match(docs[5],/APRENDER UNA PIEZA AL MENOS PARCIALMENTE MEDIANTE ESCUCHA, TRANSCRIPCIÓN Y ANÁLISIS, NO ÚNICAMENTE MEDIANTE TUTORIAL/);
  assert.match(frontmatter(docs[0]),/competencies: \[E6, F7, I3, I4, K3, K5, K8, C1, C2, C3, H5, H6\]/);
  assert.doesNotMatch(docs[0],/objetivo dominante.*autonomía FUNCIONAL/i);
});

test('U9 culmina el procedimiento de transcripción ya aprendido en U2',()=>{
  assert.match(docs[0],/PULSO → FORMA → MÉTRICA\/SUBDIVISIÓN → FUNCIÓN → ARTICULACIÓN\/DINÁMICA → DETALLE → VERIFICACIÓN/);
  assert.match(docs[0],/aplica a una pieza o a una sección suficientemente sustancial/i);
  assert.match(docs[2],/HECHO VERIFICADO/);
  assert.match(docs[2],/HIPÓTESIS DE ESCUCHA/);
  assert.match(docs[2],/APROXIMACIÓN DIDÁCTICA/);
  assert.match(docs[2],/TRANSCRIPCIÓN PUBLICADA\/VERIFICADA/);
});

test('U9 conecta escucha, representación, análisis e interpretación',()=>{
  assert.match(docs[3],/Fuente → decisión → sonido/);
  assert.match(docs[3],/Análisis que cambia una decisión/);
  assert.match(docs[4],/ESCUCHA INICIAL → HIPÓTESIS → TRANSCRIPCIÓN\/MAPA → INTERPRETACIÓN → GRABACIÓN → COMPARACIÓN → REVISIÓN/);
  assert.match(docs[5],/Escucha → representación/);
  assert.match(docs[5],/Representación\/análisis → decisión/);
  assert.match(docs[5],/Decisión → interpretación/);
});

test('U9 permite tutorial como contraste pero no como única vía',()=>{
  assert.match(docs[0],/Tutorial: permitido, pero no como única vía/);
  assert.match(docs[1],/partitura, chart o transcripción legal/i);
  assert.match(docs[4],/tutorial.*no fue la única vía/is);
  assert.match(docs[5],/tutorial o recurso externo.*no fue la única vía/is);
});

test('U9 protege copyright, procedencia e incertidumbre',()=>{
  assert.match(docs[1],/No llames «partitura oficial» o «transcripción verificada»/);
  assert.match(docs[2],/transcripción propia.*no una partitura oficial/is);
  assert.match(docs[4],/Cadena de procedencia/);
  assert.match(docs[5],/una transcripción propia se identifica como propia/);
  assert.match(docs[5],/no reproduzcas ni redistribuyas material protegido/i);
});

test('U9 conserva carga sostenible y evita pseudoprecisión',()=>{
  assert.match(docs[0],/25–30 min, 3–4 días por semana/);
  assert.match(docs[5],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[5],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[5],/AVANZADO/);
  assert.match(docs[5],/no declara Hito 7/i);
  const all=docs.join('\n');
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
});
