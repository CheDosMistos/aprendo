import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base='src/courses/bateria/content/pages';
const names=[
  'f6-u12-overview.md',
  'f6-u12-l1-auditoria-portafolio-r1-r4.md',
  'f6-u12-l2-retencion-recuperacion.md',
  'f6-u12-l3-transferencia-integrada-e6-f7-k8.md',
  'f6-u12-l4-comparacion-u1-continuidad-transicion.md',
  'f6-u12-checkpoint-hito7-cierre-fase6.md'
];
const docs=names.map(n=>readFileSync(`${base}/${n}`,'utf8'));

function frontmatter(doc:string){
  const match=doc.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match,'frontmatter ausente');
  return match[1];
}

test('Fase 6 U12 publica overview, cuatro lecciones y Checkpoint 6I',()=>{
  docs.forEach((d,i)=>{
    const fm=frontmatter(d);
    assert.match(fm,/phase: 6\nunit: 12\nunitSlug: fase-6-unidad-12/);
    assert.match(fm,/published: true/);
    assert.match(fm,new RegExp(`order: ${i}`));
  });
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/contentId: ([^\n]+)/)?.[1])).size,6);
  assert.equal(new Set(docs.map(d=>frontmatter(d).match(/slug: ([^\n]+)/)?.[1])).size,6);
  assert.match(docs[0],/4 lecciones \+ checkpoint final/);
  assert.match(docs[5],/Checkpoint 6I/);
});

test('U12 conserva K1–K8 + E6 + F7 como núcleo normativo de Hito 7',()=>{
  const all=docs.join('\n');
  for(const code of ['K1','K2','K3','K4','K5','K6','K7','K8','E6','F7']){
    assert.match(all,new RegExp(`\\b${code}\\b`));
  }
  assert.match(docs[0],/K1–K8 \+ E6 \+ F7/);
  assert.match(docs[5],/K1–K8 \+ E6 \+ F7/);
  assert.match(frontmatter(docs[0]),/competencies: \[K1, K2, K3, K4, K5, K6, K7, K8, E6, F7, I3, I4, I5, I6, H7, C7, D7, G3\]/);
});

test('U12 preserva las dos puertas: hito específico de F6 y Hito 7',()=>{
  assert.match(docs[0],/Aprender una pieza al menos parcialmente mediante escucha, transcripción y análisis, no únicamente mediante tutorial/);
  assert.match(docs[5],/APRENDER UNA PIEZA AL MENOS PARCIALMENTE MEDIANTE ESCUCHA, TRANSCRIPCIÓN Y ANÁLISIS, NO ÚNICAMENTE MEDIANTE TUTORIAL/);
  assert.match(docs[5],/HITO ESPECÍFICO F6: CUMPLIDO/);
  assert.match(docs[5],/HITO 7: APRUEBA/);
  assert.match(docs[5],/HITO 7: AÚN NO/);
});

test('U12 revisa R1–R4 sin obligar a repetir evidencia suficiente',()=>{
  const all=docs.join('\n');
  for(const route of ['R1','R2','R3','R4']) assert.match(all,new RegExp(`\\b${route}\\b`));
  assert.match(docs[1],/EVIDENCIA SUFICIENTE/);
  assert.match(docs[1],/EVIDENCIA DÉBIL/);
  assert.match(docs[1],/NO OBSERVADO/);
  assert.match(docs[1],/NO APLICA AL HITO/);
  assert.match(docs[1],/no repitas la transcripción/i);
  assert.match(docs[5],/No vuelvas a ejecutar todos los checkpoints anteriores/i);
});

test('Retención diferencia activación segura de ensayo específico y evita intervalos universales',()=>{
  assert.match(docs[2],/Calentamiento físico ≠ ensayo específico/);
  assert.match(docs[2],/preparar el cuerpo es compatible con la prueba/i);
  assert.match(docs[2],/No existe un intervalo universal/);
  assert.match(docs[2],/24 h, 48 h/i);
  assert.match(docs[2],/Una toma buena no demuestra retención por sí sola/);
  assert.match(docs[2],/DISPONIBLE/);
  assert.match(docs[2],/FRÁGIL/);
  assert.match(docs[2],/NECESITA REESTABILIZACIÓN/);
});

test('Transferencia es no idéntica y no se confunde con aumentar dificultad',()=>{
  assert.match(docs[3],/Transferencia ≠ subir dificultad/);
  assert.match(docs[3],/Transferencia con una variable nueva/);
  assert.match(docs[3],/cambia una condición que tenga relación con el aprendizaje/i);
  assert.match(docs[3],/no es una ley científica que sólo pueda cambiarse exactamente una variable/i);
  assert.match(docs[3],/No se busca demostrar que.*más difícil/is);
});

test('U12 integra E6, F7 y K8 sin forzar transcripción artificial',()=>{
  assert.match(docs[3],/E6 sólo cuando la tarea lo requiere/);
  assert.match(docs[3],/No fuerces una nueva transcripción/);
  assert.match(docs[3],/F7 debe conectar elementos, no enumerarlos/);
  assert.match(docs[3],/K8 convierte análisis en acción revisable/);
  assert.match(docs[5],/E6 y F7 aparecen integrados en el aprendizaje de repertorio/);
});

test('Comparación U1→U12 es cualitativa y deja límites explícitos',()=>{
  assert.match(docs[4],/Delta de autonomía/);
  assert.match(docs[4],/sin puntuación numérica/i);
  assert.match(docs[4],/MANTENIMIENTO/);
  assert.match(docs[4],/CORRECTIVO/);
  assert.match(docs[4],/RESERVA/);
  assert.match(docs[4],/FUTURA ESPECIALIZACIÓN/);
  assert.match(docs[4],/no exige que todas las flechas apunten/i);
});

test('Competencias de apoyo no se convierten en puertas duras nuevas',()=>{
  assert.match(docs[0],/Competencias de apoyo ≠ nuevos prerrequisitos duros/);
  assert.match(docs[0],/no cambia silenciosamente el contrato de Hito 7/i);
  assert.match(docs[5],/no se convierten silenciosamente en una segunda fórmula normativa/);
});

test('Ausencia de interacción interpersonal real no bloquea Hito 7',()=>{
  assert.match(docs[5],/INTERACCIÓN INTERPERSONAL REAL: NO OBSERVADA TODAVÍA/);
  assert.match(docs[5],/no bloquea por sí solo Hito 7/i);
  assert.match(docs[0],/una carencia de evidencia interpersonal real en I6 no invalida por sí sola Hito 7/i);
});

test('Evaluación final es cualitativa, sin media, porcentajes, BPM ni cero errores',()=>{
  const all=docs.join('\n');
  assert.match(docs[5],/No se calcula una media matemática ni un porcentaje global/);
  assert.match(docs[5],/MÍNIMO PARA AVANZAR/);
  assert.match(docs[5],/COMPETENTE \/ FUNCIONAL/);
  assert.match(docs[5],/AVANZADO/);
  assert.match(docs[5],/AVANZADO NO ES REQUISITO PARA CERRAR FASE 6/);
  assert.doesNotMatch(all,/\b\d+\s*%/);
  assert.doesNotMatch(all,/\b\d+\s*BPM\b/i);
  assert.match(docs[5],/un BPM universal/);
  assert.match(docs[5],/porcentaje mínimo de notas correctas/);
  assert.match(docs[5],/cero errores/);
});

test('Material original, copyright e incertidumbre permanecen protegidos',()=>{
  const all=docs.join('\n');
  assert.match(all,/EJERCICIO ORIGINAL CREADO PARA ESTE CURSO/);
  assert.match(docs[1],/HECHO VERIFICADO/);
  assert.match(docs[1],/HIPÓTESIS DE ESCUCHA/);
  assert.match(docs[1],/APROXIMACIÓN DIDÁCTICA/);
  assert.match(docs[5],/copias no autorizadas/);
  assert.match(docs[5],/transcripciones propias como propias/);
});

test('U12 no consume Fase 7 ni declara Hito 8',()=>{
  const all=docs.join('\n');
  assert.match(docs[0],/no enseña todavía polirritmia profunda, polimetría, modulación métrica, tuplets complejos o el núcleo de Fase 7/i);
  assert.match(docs[3],/U12 verifica transferencia con las herramientas de Fase 6/);
  assert.match(docs[4],/Esos contenidos necesitarán su propia arquitectura/);
  assert.match(docs[5],/Hito 8/);
  assert.doesNotMatch(docs[5],/HITO 8:\s*APRUEBA/i);
});

test('Cierre formal de Fase 6 sólo ocurre tras Hito 7 aprobado',()=>{
  assert.match(docs[5],/Cuando las dos puertas están satisfechas/);
  assert.match(docs[5],/HITO 7: APRUEBA/);
  assert.match(docs[5],/FASE 6 QUEDA CERRADA/);
  assert.match(docs[5],/AÚN NO.*no reinicia Fase 6/is);
});

test('Fuentes reutilizadas son trazables y no se presentan como receta universal',()=>{
  assert.match(docs[0],/10\.1016\/j\.bbr\.2011\.11\.028/);
  assert.match(docs[0],/10\.3389\/fpsyg\.2019\.01583/);
  assert.match(docs[0],/10\.1177\/0305735614554639/);
  assert.match(docs[0],/no prescribe un protocolo único/i);
});
