import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src/courses/bateria/content/pages');
const files = (await readdir(root)).filter((name) => name.endsWith('.md'));

const generic = [
  ['coordinación básica de cuatro extremidades coordinación de cuatro extremidades', 'coordinación de cuatro extremidades'],
  ['groove y variaciones groove', 'groove'],
  ['groove groove y variaciones', 'groove y variaciones'],
  ['fills fills', 'fills'],
  ['improvisación restringida orquestación creativa', 'orquestación creativa'],
  ['orquestación creativa improvisación restringida', 'orquestación creativa'],
  ['independencia avanzada independencia avanzada', 'independencia avanzada'],
  ['independencia avanzada independencia', 'independencia avanzada'],
  ['orquestación de rudimentos/orquestación focal', 'orquestación focal'],
  ['una base coordinación básica', 'una base de coordinación básica'],
  [' conforme al mapa', ''],
  [' que fija el mapa', ''],
  ['todos los evaluaciones', 'todas las evaluaciones'],
  ['Auditoría los cuatro carriles', 'Auditoría de los cuatro carriles'],
];

const fileSpecific = new Map([
  ['f4-u2-overview.md', [
    ['Esta unidad trabaja **adaptación técnica entre superficies y kit** y el componente manual de **orquestación de rudimentos**. También prepara la futura orquestación creativa, pero no declara improvisación restringida MÍNIMO ni orquestación de rudimentos-kit completo antes de disponer de la coordinación básica de cuatro extremidades.', 'Esta unidad trabaja **adaptación técnica entre superficies y kit** y el componente manual de **orquestación de rudimentos**. También prepara futuras tareas de orquestación creativa, pero no declara todavía esas capacidades como funcionales antes de disponer de una coordinación básica de cuatro extremidades.'],
  ]],
  ['f4-u2-l4-identidad-superficies-retorno.md', [
    ['Esta es **preparación manual** para la futura improvisación restringida y desarrollo de adaptación técnica entre superficies y kit/orquestación de rudimentos. No certifica coordinación básica de cuatro extremidades, improvisación restringida MÍNIMO completo ni orquestación de rudimentos-kit competente antes de sus dependencias.', 'Esta es **preparación manual** para futuras tareas de improvisación y orquestación en el kit. No certifica todavía coordinación de cuatro extremidades ni competencia completa de orquestación; esas capacidades se desarrollan más adelante.'],
  ]],
  ['f4-u3-checkpoint-bombo-primera-voz-pie.md', [
    ['El objetivo es comprobar si el bombo está **disponible como primera voz de pie** a nivel bombo MÍNIMO.', 'El objetivo es comprobar si el bombo está **disponible como primera voz de pie** al nivel MÍNIMO PARA AVANZAR.'],
    ['## COMPETENTE EN EL ÁMBITO DE esta unidad', '## COMPETENTE / FUNCIONAL EN ESTA UNIDAD'],
    ['**AVANZA:** bombo MÍNIMO está suficientemente disponible;', '**AVANZA:** el bombo está suficientemente disponible al nivel mínimo;'],
  ]],
  ['f4-u3-l4-sustitucion-manos-bombo.md', [
    ['- no conviertes esta tarea en groove y variaciones ni coordinación básica de cuatro extremidades certificado;', '- no conviertes esta tarea en groove y variaciones ni en una certificación de coordinación de cuatro extremidades;'],
  ]],
  ['f4-u4-overview.md', [
    ['El mapa hace **bombo y hi-hat de pie ramas paralelas tras setup, ergonomía y ecología del kit**.', 'El recorrido trata **bombo y hi-hat de pie como ramas paralelas después de setup, ergonomía y ecología del kit**.'],
    ['Demuestra hi-hat de pie MÍNIMO sin exigir bombo, groove, coordinación básica de cuatro extremidades o independencia avanzada.', 'Demuestra el mínimo requerido de hi-hat de pie sin exigir bombo, groove, coordinación de cuatro extremidades o independencia avanzada.'],
    ['exposición no equivale a coordinación básica de cuatro extremidades MÍNIMO.', 'exposición no equivale a alcanzar el MÍNIMO PARA AVANZAR en coordinación de cuatro extremidades.'],
  ]],
  ['f4-u4-checkpoint-hihat-pie-disponible.md', [
    ['Comprueba si el hi-hat de pie está disponible a nivel **hi-hat de pie MÍNIMO**.', 'Comprueba si el hi-hat de pie alcanza el **MÍNIMO PARA AVANZAR**.'],
    ['No exige bombo. bombo y hi-hat de pie son ramas paralelas', 'No exige bombo. Bombo y hi-hat de pie son ramas paralelas'],
    ['## COMPETENTE EN EL ÁMBITO DE esta unidad', '## COMPETENTE / FUNCIONAL EN ESTA UNIDAD'],
    ['**AVANZA:** hi-hat de pie MÍNIMO está suficientemente disponible.', '**AVANZA:** el hi-hat de pie está suficientemente disponible al nivel mínimo.'],
  ]],
  ['f4-u4-l4-referencia-pie-manos.md', [
    ['coordinación básica de cuatro extremidades exige disponibilidad suficiente de bombo y hi-hat de pie y tendrá su foco explícito en Unidad 6.', 'La coordinación básica de cuatro extremidades exige disponibilidad suficiente de bombo y hi-hat de pie y tendrá su foco explícito en Unidad 6.'],
  ]],
  ['f4-u5-overview.md', [
    ['El mapa sitúa groove y variaciones después de una base de coordinación básica de cuatro extremidades, pero', 'El recorrido sitúa groove y variaciones después de una base de coordinación de cuatro extremidades, pero'],
    ['Esta unidad **no certifica coordinación básica de cuatro extremidades MÍNIMO** ni independencia avanzada.', 'Esta unidad **no certifica todavía el MÍNIMO PARA AVANZAR en coordinación de cuatro extremidades** ni independencia avanzada.'],
  ]],
  ['f4-u5-l4-puente-cuatro-extremidades.md', [
    ['Ejecutar ocasionalmente este ejercicio aporta evidencia hacia coordinación básica de cuatro extremidades, pero **no certifica coordinación básica de cuatro extremidades MÍNIMO** ni independencia avanzada.', 'Ejecutar ocasionalmente este ejercicio aporta evidencia hacia la coordinación de cuatro extremidades, pero **no certifica por sí solo el MÍNIMO PARA AVANZAR** ni independencia avanzada.'],
    ['comprende que exposición no equivale a competencia coordinación básica de cuatro extremidades certificada.', 'comprende que exposición no equivale a competencia certificada en coordinación de cuatro extremidades.'],
  ]],
  ['f4-u6-checkpoint-h4-minimo.md', [
    ['## MÍNIMO PARA coordinación básica de cuatro extremidades', '## MÍNIMO PARA AVANZAR'],
    ['- **COMPETENTE/FUNCIONAL**;\n- **COMPETENTE/FUNCIONAL**;\n- **independencia**;', '- coordinación de cuatro extremidades en nivel **COMPETENTE/FUNCIONAL**;\n- groove y variaciones en nivel **COMPETENTE/FUNCIONAL**;\n- independencia avanzada;'],
    ['La perfección no es requisito: coordinación básica de cuatro extremidades MÍNIMO exige coordinación suficientemente estable', 'La perfección no es requisito: el MÍNIMO PARA AVANZAR exige una coordinación de cuatro extremidades suficientemente estable'],
  ]],
  ['f4-u7-overview.md', [
    ['summary: "Convierte coordinación básica de cuatro extremidades mínimo en groove y variaciones estable:', 'summary: "Convierte una coordinación mínima de cuatro extremidades en un groove estable con variaciones:'],
    ['## Objetivo explícito: groove y variaciones MÍNIMO', '## Objetivo explícito: groove estable con una variación controlada'],
    ['Unidad 6 cerró **coordinación básica de cuatro extremidades MÍNIMO**.', 'Unidad 6 cerró el **MÍNIMO PARA AVANZAR en coordinación de cuatro extremidades**.'],
    ['### Evaluación — groove y variaciones MÍNIMO', '### Evaluación — groove estable y variación controlada'],
  ]],
  ['f4-u7-checkpoint-h5-minimo.md', [
    ['Comprueba si **groove y variaciones MÍNIMO** está suficientemente disponible', 'Comprueba si el **MÍNIMO PARA AVANZAR en groove y variaciones** está suficientemente disponible'],
    ['## MÍNIMO PARA groove y variaciones', '## MÍNIMO PARA AVANZAR'],
    ['- COMPETENTE/FUNCIONAL;\n- COMPETENTE/FUNCIONAL global;\n- independencia;\n- fills;\n- orquestación focal de Unidad 8;', '- groove y variaciones en nivel COMPETENTE/FUNCIONAL;\n- coordinación de cuatro extremidades en nivel COMPETENTE/FUNCIONAL global;\n- independencia avanzada;\n- fills;\n- orquestación focal de rudimentos de Unidad 8;'],
    ['Una variación predeterminada puede aportar evidencia hacia coordinación básica de cuatro extremidades competente, pero **no certifica coordinación básica de cuatro extremidades competente automáticamente**.', 'Una variación predeterminada puede aportar evidencia de coordinación competente de cuatro extremidades, pero **no la certifica automáticamente**.'],
    ['**AVANZA:** groove y variaciones MÍNIMO está suficientemente disponible.', '**AVANZA:** el groove y sus variaciones están suficientemente disponibles al nivel mínimo.'],
  ]],
  ['f4-u8-l4-motivo-propio-al-kit.md', [
    ['esta unidad no la certifica como fill.', 'esta unidad no la certifica automáticamente como fill.'],
    ['Tampoco entrena independencia avanzada como independencia sistemática.', 'Tampoco entrena independencia sistemática avanzada.'],
  ]],
  ['f4-u9-checkpoint-h6-minimo.md', [
    ['title: "Evaluación — fills MÍNIMO: fill y retorno"', 'title: "Evaluación — Fill sencillo y retorno"'],
    ['El criterio global que puede cerrarse aquí es **fills MÍNIMO**:', 'El criterio global que puede cerrarse aquí es el **MÍNIMO PARA AVANZAR en fills**:'],
    ['## MÍNIMO PARA fills', '## MÍNIMO PARA AVANZAR'],
    ['## independencia avanzada queda abierto', '## La independencia avanzada queda abierta'],
    ['- independencia avanzada;', '- independencia avanzada;'],
    ['La siguiente unidad integra setup, ergonomía y ecología del kit–fills + adaptación técnica entre superficies y kit/orquestación de rudimentos dentro del **Hito 5**.', 'La siguiente unidad integra configuración, pedales, coordinación, groove, fills y transferencia al kit dentro del **Hito 5**.'],
  ]],
  ['f4-u10-checkpoint-hito5.md', [
    ['- independencia avanzada;', '- independencia avanzada;'],
    ['Este Hito cierra la arquitectura de **Transferencia al kit** al nivel previsto.', 'Este Hito cierra el recorrido de **Transferencia al kit** al nivel previsto.'],
  ]],
]);

let changed = 0;
for (const filename of files) {
  const filepath = path.join(root, filename);
  let text = await readFile(filepath, 'utf8');
  const before = text;
  for (const [from, to] of generic) text = text.split(from).join(to);
  for (const [from, to] of fileSpecific.get(filename) ?? []) text = text.split(from).join(to);
  if (text !== before) {
    await writeFile(filepath, text, 'utf8');
    changed += 1;
  }
}

console.log(`Final F4 learner-language repair changed ${changed} file(s).`);
