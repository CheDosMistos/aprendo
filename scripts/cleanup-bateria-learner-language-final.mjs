import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src/courses/bateria/content/pages');

const replacements = new Map([
  ['f2-u6-overview.md', [
    ['La arquitectura `4 lecciones + Evaluación` es una **DECISIÓN CURRICULAR RAZONADA** derivada del Plan General aprobado, Fase 2, el recorrido del curso y `20_U6_COMPAS_COMPUESTO_I_6_8.md`. No son cinco días obligatorios.', 'La organización en **4 lecciones + evaluación** es una decisión didáctica para repartir la carga; no implica cinco días obligatorios.'],
  ]],
  ['f2-u8-l2-flam-escrito-grace-note-y-principal.md', [
    ['En el objetivo paradiddles del mapa de competencias, el mínimo relevante es distinguir **grace note y principal** y evitar un flam claramente plano.', 'Para el flam, el mínimo relevante es distinguir **grace note y principal** y evitar un flam claramente plano.'],
  ]],
  ['f3-u4-checkpoint-3a-hito-global-3.md', [
    ['El Plan General define literalmente el **Hito 3 — Ciclo completo** así:', 'El **Hito 3 — Ciclo completo** se define así:'],
  ]],
  ['f3-u4-overview.md', [
    ['Se conserva literalmente el hito del Plan General:', 'El hito de esta fase se mantiene así:'],
  ]],
  ['f6-u12-overview.md', [
    ['El Plan General exige:', 'El cierre de fase exige:'],
    ['El cierre conserva las reglas ya establecidas en el Plan General y en el sistema de evaluación.', 'El cierre conserva las reglas ya establecidas en el sistema de evaluación.'],
  ]],
  ['f6-u4-l4-del-sistema-a-la-musica.md', [
    ['La Biblioteca Maestra registra recursos como Dahlgren & Fine, Dawson/Ramsay, Chapin y *The New Breed*.', 'Como ampliación, puedes recurrir de forma selectiva a Dahlgren & Fine, Dawson/Ramsay, Chapin y *The New Breed*.'],
  ]],
  ['f6-u4-overview.md', [
    ['Dahlgren & Fine, Dawson/Ramsay, Chapin y *The New Breed* permanecen como **herramientas selectivas** registradas en la Biblioteca Maestra.', 'Dahlgren & Fine, Dawson/Ramsay, Chapin y *The New Breed* permanecen como **herramientas selectivas de ampliación**; no constituyen un recorrido obligatorio.'],
  ]],
  ['f6-u7-l3-contraste-familias-estilisticas.md', [
    ['El Documento Fundacional prevé rock/pop, blues/shuffle, funk/soul/R&B, jazz, reggae, Afro-Cuban/Brazilian/Latin, punk, metal, fusion y progressive. Esta unidad **no pretende dominar esa lista**.', 'El curso contempla rock/pop, blues/shuffle, funk/soul/R&B, jazz, reggae, Afro-Cuban/Brazilian/Latin, punk, metal, fusion y progressive. Esta unidad **no pretende dominar esa lista**.'],
  ]],
  ['f7-u2-l4-groove-fraseo-ilusion.md', [
    ['La Biblioteca Maestra cataloga *Rhythmic Visions* de Gavin Harrison como recurso primario de ampliación para desplazamiento, subdivisión e ilusiones rítmicas. No es obligatorio y el curso no reproduce material protegido del método.', 'Como recurso de ampliación para desplazamiento, subdivisión e ilusiones rítmicas, puede consultarse *Rhythmic Visions* de Gavin Harrison. No es obligatorio y el curso no reproduce material protegido del método.'],
  ]],
  ['f7-u2-overview.md', [
    ['La Biblioteca Maestra identifica *Rhythmic Visions* de Gavin Harrison como recurso primario pertinente para desplazamientos de acento y motivo, subdivisión e ilusiones rítmicas. Es **ampliación de pago**, no currículo obligatorio, y esta unidad no reproduce sus ejercicios.', '*Rhythmic Visions* de Gavin Harrison es un recurso de ampliación pertinente para desplazamientos de acento y motivo, subdivisión e ilusiones rítmicas. Es **ampliación de pago**, no currículo obligatorio, y esta unidad no reproduce sus ejercicios.'],
  ]],
  ['f7-u3-overview.md', [
    ['El mapa y la Biblioteca Maestra ya relacionan este territorio con autores como Gary Chaffee y Gavin Harrison. Se consideran **herramientas de ampliación**, no currículo obligatorio. Esta unidad no reproduce ejercicios de esos métodos: las partituras y tareas prácticas de esta unidad son material original del curso.', 'Como ampliación pueden consultarse autores como Gary Chaffee y Gavin Harrison. Sus métodos son **herramientas de ampliación**, no currículo obligatorio. Esta unidad no reproduce sus ejercicios: las partituras y tareas prácticas son material original del curso.'],
  ]],
  ['f7-u6-overview.md', [
    ['La Biblioteca Maestra relaciona polirritmia con Gary Chaffee y Gavin Harrison. Son **fuentes pedagógicas primarias / herramientas de ampliación**, no autoridad normativa ni prueba de una progresión didáctica superior. Esta unidad no reproduce ejercicios de esos métodos.', 'Como recursos de ampliación para polirritmia pueden consultarse Gary Chaffee y Gavin Harrison. Son **fuentes pedagógicas primarias / herramientas de ampliación**, no autoridad normativa ni prueba de una progresión didáctica superior. Esta unidad no reproduce ejercicios de esos métodos.'],
  ]],
  ['f7-u8-overview.md', [
    ['Como ampliación posterior, la Biblioteca Maestra registra Gary Chaffee, *Patrones de Ritmo y Compás* (Alfred Music), cuya editorial declara trabajo con ritmos impares, compases mixtos, polirritmia y modulación métrica. El libro es un recurso de profundización, no el currículo ni la fuente de los ejercicios originales de esta unidad:', 'Como ampliación posterior puede consultarse Gary Chaffee, *Patrones de Ritmo y Compás* (Alfred Music), cuya editorial declara trabajo con ritmos impares, compases mixtos, polirritmia y modulación métrica. El libro es un recurso de profundización, no el currículo ni la fuente de los ejercicios originales de esta unidad:'],
  ]],
  ['f7-u9-overview.md', [
    ['El Plan General establece que el cierre de Fase 7 no consiste en “tocar cosas raras”. El alumno debe poder:', 'El cierre de Fase 7 no consiste en “tocar cosas raras”. El alumno debe poder:'],
    ['No se asigna automáticamente ningún método comercial como “método de integración progresiva y experimental”. La Biblioteca Maestra advierte expresamente que materiales como *Rhythmic Horizons* no deben etiquetarse como integración progresiva y experimental sin verificar el contenido concreto. Por tanto, esta unidad usa material original del curso y remite a recursos externos sólo cuando una lección futura tenga una correspondencia verificada.', 'No se asigna automáticamente ningún método comercial como “método de integración progresiva y experimental”. Materiales como *Rhythmic Horizons* sólo deben recomendarse cuando su contenido concreto corresponda a la tarea. Esta unidad usa material original del curso y remite a recursos externos únicamente cuando exista una correspondencia verificada.'],
  ]],
]);

let changed = 0;
for (const [filename, pairs] of replacements) {
  const filepath = path.join(root, filename);
  let text = await readFile(filepath, 'utf8');
  const before = text;
  for (const [from, to] of pairs) text = text.replace(from, to);
  if (text !== before) {
    await writeFile(filepath, text, 'utf8');
    changed += 1;
  }
}

// A few units used “Arquitectura de esta unidad” as a learner-facing heading.
for (const filename of ['f2-u10-overview.md', 'f2-u8-overview.md', 'f2-u9-overview.md']) {
  const filepath = path.join(root, filename);
  let text = await readFile(filepath, 'utf8');
  const next = text.replace('## Arquitectura de esta unidad', '## Recorrido de la unidad');
  if (next !== text) {
    await writeFile(filepath, next, 'utf8');
    changed += 1;
  }
}

console.log(`Final editorial repair touched ${changed} file operation(s).`);
