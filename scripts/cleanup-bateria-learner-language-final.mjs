import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src/courses/bateria/content/pages');

const replacements = new Map([
  ['f2-u1-overview.md', [
    ['**Puerta de fluidez binaria** — Evaluación para decidir el siguiente paso.', '**Puerta de fluidez binaria** — evaluación para decidir el siguiente paso.'],
  ]],
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
  ['f4-u10-overview.md', [
    ['- adaptación/orquestación A8/B8 de U2/U8;', '- adaptación y orquestación de material conocido en las Unidades 2 y 8;'],
    ['- bombo H2 de U3;', '- técnica de bombo de la Unidad 3;'],
    ['- hi-hat de pie H3 de U4;', '- hi-hat de pie de la Unidad 4;'],
    ['- Groove A y coordinación H4 de U5/U6;', '- Groove A y coordinación de cuatro extremidades de las Unidades 5 y 6;'],
    ['- independencia H7;', '- independencia avanzada;'],
    ['Cerrar el Hito tampoco convierte automáticamente H4/H5/H6 en **COMPETENTE/FUNCIONAL**.', 'Cerrar el Hito tampoco convierte automáticamente coordinación, groove y fills en **COMPETENTE/FUNCIONAL**.'],
  ]],
  ['f5-u12-overview.md', [
    ['K7 sigue activo. Al tocar piezas completas, aumenta la exposición acumulada del kit.', 'La gestión de carga y salud sigue activa. Al tocar piezas completas, aumenta la exposición acumulada del kit.'],
  ]],
  ['f6-u12-overview.md', [
    ['El Plan General exige:', 'El cierre de fase exige:'],
    ['La fuente de Fase 6 también espera evidencia acumulada, cuando corresponda, de repertorio, transferencia estilística, interacción, independencia, tiempo, lectura y creatividad.', 'El diseño de Fase 6 también espera evidencia acumulada, cuando corresponda, de repertorio, transferencia estilística, interacción, independencia, tiempo, lectura y creatividad.'],
    ['1. **L1 — Auditoría R1–R4: qué evidencia existe y qué falta realmente.**', '1. **Lección 1 — Auditoría de los cuatro carriles del portafolio: qué evidencia existe y qué falta realmente.**'],
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
    ['La literatura reciente ha usado terminología parcialmente inconsistente. La revisión canónica del proyecto recomienda separar polirritmia y polimetría;', 'La literatura reciente ha usado terminología parcialmente inconsistente. La base documental del curso recomienda separar polirritmia y polimetría;'],
    ['Además conviene que el alumno pueda mantener una referencia estable durante una manipulación rítmica. J5 ayuda, pero **no es una dependencia dura de J6** según el mapa aprobado.', 'Además conviene que el alumno pueda mantener una referencia estable durante una manipulación rítmica. La experiencia con ciclos que cruzan compases ayuda, pero **no es un requisito imprescindible** para esta unidad.'],
    ['En U6 las dos capas comparten un ciclo temporal explícito. **J7** estudiará capas métricas donde pueden coexistir organizaciones de barra diferentes y puntos de realineación más amplios.', 'Aquí las dos capas comparten un ciclo temporal explícito. La unidad de **polimetría** estudiará capas métricas donde pueden coexistir organizaciones de barra diferentes y puntos de realineación más amplios.'],
    ['En U6 no reinterpretamos una subdivisión como nuevo tempo. **J8** estudiará cuándo una relación interna pasa a definir un nuevo pulso calculable.', 'Aquí no reinterpretamos una subdivisión como nuevo tempo. La unidad de **modulación métrica** estudiará cuándo una relación interna pasa a definir un nuevo pulso calculable.'],
    ['La Biblioteca Maestra relaciona J6 con Gary Chaffee y Gavin Harrison. Son **fuentes pedagógicas primarias / herramientas de ampliación**, no autoridad normativa ni prueba de una progresión didáctica superior. U6 no reproduce ejercicios de esos métodos.', 'Como recursos de ampliación para polirritmia pueden consultarse Gary Chaffee y Gavin Harrison. Son **fuentes pedagógicas primarias / herramientas de ampliación**, no autoridad normativa ni prueba de una progresión didáctica superior. Esta unidad no reproduce ejercicios de esos métodos.'],
    ['La auditoría canónica del proyecto incorpora además la revisión de Nijhuis et al. (2026) como evidencia de síntesis para percepción/producción de polirritmos y para afinar la distinción J6/J7.', 'La base documental del curso incorpora además la revisión de Nijhuis et al. (2026) como evidencia de síntesis para percepción/producción de polirritmos y para afinar la distinción entre polirritmia y polimetría.'],
    ['La Biblioteca Maestra relaciona polirritmia con Gary Chaffee y Gavin Harrison. Son **fuentes pedagógicas primarias / herramientas de ampliación**, no autoridad normativa ni prueba de una progresión didáctica superior. Esta unidad no reproduce ejercicios de esos métodos.', 'Como recursos de ampliación para polirritmia pueden consultarse Gary Chaffee y Gavin Harrison. Son **fuentes pedagógicas primarias / herramientas de ampliación**, no autoridad normativa ni prueba de una progresión didáctica superior. Esta unidad no reproduce ejercicios de esos métodos.'],
  ]],
  ['f7-u7-overview.md', [
    ['### Polimetría ≠ ciclo trans-barra de J5', '### Polimetría ≠ ciclo que cruza compases'],
  ]],
  ['f7-u8-overview.md', [
    ['Como ampliación posterior, la Biblioteca Maestra registra Gary Chaffee, *Patrones de Ritmo y Compás* (Alfred Music), cuya editorial declara trabajo con ritmos impares, compases mixtos, polirritmia y modulación métrica. El libro es un recurso de profundización, no el currículo ni la fuente de los ejercicios originales de esta unidad:', 'Como ampliación posterior puede consultarse Gary Chaffee, *Patrones de Ritmo y Compás* (Alfred Music), cuya editorial declara trabajo con ritmos impares, compases mixtos, polirritmia y modulación métrica. El libro es un recurso de profundización, no el currículo ni la fuente de los ejercicios originales de esta unidad:'],
  ]],
  ['f7-u8-checkpoint-7h.md', [
    ['title: "Checkpoint 7H — J8 funcional: modulación métrica calculable y audible"', 'title: "Evaluación — Modulación métrica calculable y audible"'],
    ['summary: "Evalúa J8 sin reducirlo a BPM:', 'summary: "Evalúa la modulación métrica sin reducirla a BPM:'],
    ['J8 es funcional si, de manera reproducible:', 'La modulación métrica es funcional si, de manera reproducible:'],
    ['Con este nivel, J8 queda disponible para la integración de J9.', 'Con este nivel, la modulación métrica queda disponible para la integración progresiva y experimental.'],
  ]],
  ['f7-u9-checkpoint-7i.md', [
    ['title: "Checkpoint 7I — J9 funcional y Hito 8"', 'title: "Evaluación — Integración progresiva y Hito 8"'],
    ['## Auditoría J1–J8', '## Revisión de los recursos rítmicos trabajados'],
  ]],
  ['f7-u9-overview.md', [
    ['El Plan General establece que el cierre de Fase 7 no consiste en “tocar cosas raras”. El alumno debe poder:', 'El cierre de Fase 7 no consiste en “tocar cosas raras”. El alumno debe poder:'],
    ['No se asigna automáticamente ningún método comercial como “método de J9”. La Biblioteca Maestra advierte expresamente que materiales como *Rhythmic Horizons* no deben etiquetarse como J9 sin verificar el contenido concreto. Por tanto, U9 usa material original del curso y remite a recursos externos sólo cuando una lección futura tenga una correspondencia verificada.', 'No se asigna automáticamente ningún método comercial como “método de integración progresiva y experimental”. Materiales como *Rhythmic Horizons* sólo deben recomendarse cuando su contenido concreto corresponda a la tarea. Esta unidad usa material original del curso y remite a recursos externos únicamente cuando exista una correspondencia verificada.'],
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

for (const filename of ['f2-u10-overview.md', 'f2-u8-overview.md', 'f2-u9-overview.md']) {
  const filepath = path.join(root, filename);
  let text = await readFile(filepath, 'utf8');
  const next = text.replace('## Arquitectura de esta unidad', '## Recorrido de la unidad');
  if (next !== text) {
    await writeFile(filepath, next, 'utf8');
    changed += 1;
  }
}

// Generic grammar repairs caused by replacing internal labels with readable names.
for (const filename of (await readdir(root)).filter((name) => name.endsWith('.md'))) {
  const filepath = path.join(root, filename);
  let text = await readFile(filepath, 'utf8');
  const before = text;
  text = text.replace(/\+ Evaluación final/g, '+ evaluación final');
  text = text.replace(/\+ Evaluación/g, '+ evaluación');
  text = text.replace(/todos los evaluaciones/g, 'todas las evaluaciones');
  text = text.replace(/Auditoría los cuatro carriles/g, 'Auditoría de los cuatro carriles');
  text = text.replace(/\badaptación\/orquestación adaptación técnica entre superficies y kit\/orquestación de rudimentos\b/g, 'adaptación y orquestación de material conocido');
  text = text.replace(/\b(bombo) bombo\b/g, '$1');
  text = text.replace(/\b(hi-hat de pie) hi-hat de pie\b/g, '$1');
  text = text.replace(/\bcoordinación coordinación básica de cuatro extremidades\b/g, 'coordinación básica de cuatro extremidades');
  text = text.replace(/\bindependencia independencia avanzada\b/g, 'independencia avanzada');
  text = text.replace(/\bintegración de integración progresiva y experimental\b/g, 'integración progresiva y experimental');
  text = text.replace(/\bmodulación métrica es funcional\b/g, 'La modulación métrica es funcional');
  text = text.replace(/\btodos los evaluaciones\b/g, 'todas las evaluaciones');
  if (text !== before) {
    await writeFile(filepath, text, 'utf8');
    changed += 1;
  }
}

console.log(`Final editorial repair touched ${changed} file operation(s).`);
