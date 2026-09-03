import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const pagesDir = path.resolve('src/courses/bateria/content/pages');

const competencyNames = {
  A1: 'postura y relajación', A2: 'agarre principal', A3: 'fulcrum y dedos', A4: 'movimientos full, down, up y tap', A5: 'rebote controlado', A6: 'dobles', A7: 'Moeller', A8: 'adaptación técnica entre superficies y kit',
  B1: 'singles y redobles', B2: 'dobles', B3: 'paradiddles', B4: 'flams', B5: 'drags', B6: 'rolls avanzados', B7: 'aplicación musical de rudimentos', B8: 'orquestación de rudimentos',
  C1: 'pulso interno', C2: 'subdivisión binaria y ternaria', C3: 'cambios de subdivisión', C4: 'metrónomo y click reducido', C5: 'click desplazado o no obvio', C6: 'click con gaps', C7: 'microtiming y placement',
  D1: 'figuras, silencios y compás', D2: 'síncopa', D3: 'tuplets y ornamentación', D4: 'lectura de compás', D5: 'forma y lectura de chart', D6: 'primera vista rítmica', D7: 'lectura aplicada al kit',
  E1: 'reconocimiento de pulso y subdivisión', E2: 'imitación rítmica', E3: 'dictado', E4: 'relación entre oído y notación', E5: 'grabación y comparación', E6: 'transcripción real',
  F1: 'teoría básica del pulso y las figuras', F2: 'métrica y terminología rítmica', F3: 'forma y frase', F4: 'dinámica y acentuación', F5: 'articulación', F6: 'instrumento y sonido', F7: 'análisis musical',
  G1: 'motivo', G2: 'desarrollo motívico', G3: 'composición de fills y secciones', G4: 'composición de piezas', G5: 'improvisación restringida', G6: 'improvisación abierta y experimental',
  H1: 'setup, ergonomía y ecología del kit', H2: 'bombo', H3: 'hi-hat de pie', H4: 'coordinación básica de cuatro extremidades', H5: 'groove y variaciones', H6: 'fills', H7: 'independencia avanzada', H8: 'balance, sonido y orquestación',
  I1: 'rock, pop y funk', I2: 'blues y shuffle', I3: 'formas y canciones', I4: 'repertorio', I5: 'transferencia entre estilos', I6: 'interacción y ensemble',
  J1: 'agrupaciones dentro de 4/4', J2: 'desplazamientos de acento y motivo', J3: 'métricas impares y mixtas', J4: 'tuplets de 5 y 7 y divisiones no estándar', J5: 'ciclos que cruzan compases', J6: 'polirritmia', J7: 'polimetría', J8: 'modulación métrica', J9: 'integración progresiva y experimental',
  K1: 'objetivos de práctica', K2: 'grabación y autoevaluación', K3: 'diagnóstico de errores', K4: 'práctica espaciada', K5: 'interleaving sensato', K6: 'recuperación y retención', K7: 'gestión de carga y salud', K8: 'autonomía',
};

const portfolioNames = {
  R1: 'Escucha y transcripción',
  R2: 'Chart y lectura',
  R3: 'Transferencia entre estilos',
  R4: 'Proyecto autónomo',
};

function splitFrontmatter(source) {
  if (!source.startsWith('---\n')) return { before: '', frontmatter: '', body: source };
  const end = source.indexOf('\n---\n', 4);
  if (end === -1) return { before: '', frontmatter: '', body: source };
  return { before: '---\n', frontmatter: source.slice(4, end), body: source.slice(end + 5) };
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function stripReadableCodePrefixes(text) {
  let result = text;
  for (const id of Object.keys(competencyNames)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Only a spaced dash is treated as “CODE — readable label”. This avoids splitting C2-R.
    result = result.replace(new RegExp(`\\b${escaped}(?:-(?:R|F|C))?\\s+(?:—|–|-)\\s+(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])`, 'g'), '');
  }
  return result;
}

function tidyLine(text) {
  let line = text;
  line = line.replace(/\bLección (\d+)\s*[–-]\s*Lección (\d+)\b/g, 'Lecciones $1–$2');
  line = line.replace(/\bUnidad (\d+)\s*[–-]\s*Unidad (\d+)\b/g, 'Unidades $1–$2');
  line = line.replace(/\bel Evaluación\b/g, 'la evaluación').replace(/\bEl Evaluación\b/g, 'La evaluación');
  line = line.replace(/\beste Evaluación\b/g, 'esta evaluación').replace(/\bEste Evaluación\b/g, 'Esta evaluación');
  line = line.replace(/\bdel Evaluación\b/g, 'de la evaluación');
  line = line.replace(/\bde la unidad de la unidad\b/g, 'de la unidad');
  line = line.replace(/\bEn esta unidad esta unidad\b/g, 'En esta unidad');
  line = line.replace(/\besta unidad esta unidad\b/g, 'esta unidad');
  line = line.replace(/\bla esta unidad\b/g, 'esta unidad').replace(/\bel esta unidad\b/g, 'esta unidad');
  line = line.replace(/\bUnidad esta unidad\b/g, 'esta unidad');
  line = line.replace(/\bcheckpoints\b/gi, 'evaluaciones').replace(/\bcheckpoint\b/gi, 'evaluación');
  line = line.replace(/^esta unidad\b/, 'Esta unidad');
  line = line.replace(/([.!?]\s+)esta unidad\b/g, '$1Esta unidad');
  line = line.replace(/^el curso\b/, 'El curso');
  line = line.replace(/^la base documental\b/, 'La base documental');
  line = line.replace(/^el diseño del curso\b/, 'El diseño del curso');
  return line;
}

function transformVisibleLine(input, { unit = 0, field = 'body' } = {}) {
  let text = input;

  if (field === 'title') text = text.replace(/^(?:10|20|30|40|50|60|70)\.U\d+\s*[—–:-]\s*/i, '');
  text = text.replace(/\b(?:10|20|30|40|50|60|70)\.U(\d+)\b/g, 'Unidad $1');
  text = text.replace(/\bCheckpoint\s+\d+[A-I]\b/gi, 'Evaluación');
  text = text.replace(/\bCheckpoint\b/gi, 'Evaluación');
  text = text.replace(/\bCP\b/g, 'evaluación');
  text = text.replace(/\b(?:la\s+)?Puerta\s+P[1-9]\b/gi, 'la puerta de entrada de la fase');
  text = text.replace(/\bP[1-9]\b/g, 'puerta de entrada');

  text = text.replace(/\bJ1\s*[–-]\s*J9\b/g, 'los recursos rítmicos avanzados de esta fase');
  text = text.replace(/\bJ1\s*[–-]\s*J8\b/g, 'los recursos rítmicos trabajados en las unidades anteriores');
  text = text.replace(/\bK1\s*[–-]\s*K8\b/g, 'las capacidades de práctica y autonomía');
  text = text.replace(/\bC1\s*[–-]\s*C3\b/g, 'pulso, subdivisión y cambios de subdivisión');
  text = text.replace(/\bR1\s*[–-]\s*R4\b/g, 'los cuatro carriles del portafolio');

  // Dependency suffixes are internal. When they work as list labels, remove the label entirely.
  text = text.replace(/\*\*\s*[A-K][1-9]-(?:R|F|C):\s*\*\*\s*/g, '');
  text = text.replace(/\b[A-K][1-9]-(?:R|F|C):\s*/g, '');

  text = stripReadableCodePrefixes(text);
  for (const [id, label] of Object.entries(competencyNames)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`\\b${escaped}(?:-(?:R|F|C))?\\b`, 'g'), label);
  }
  for (const [id, label] of Object.entries(portfolioNames)) {
    text = text.replace(new RegExp(`\\b${id}\\b`, 'g'), label);
  }

  if (unit) text = text.replace(new RegExp(`\\bU${unit}\\b`, 'g'), 'esta unidad');
  text = text.replace(/\bU(1[0-2]|[1-9])\b/g, 'Unidad $1');
  text = text.replace(/\bL([1-9])\b/g, 'Lección $1');
  text = text.replace(/\b[1-7][A-I]\b/g, 'evaluación final');

  text = text.replace(/\bEl mapa aprobado\b/g, 'El curso').replace(/\bel mapa aprobado\b/g, 'el curso');
  text = text.replace(/\bEl mapa de competencias\b/g, 'El recorrido del curso').replace(/\bel mapa de competencias\b/g, 'el recorrido del curso');
  text = text.replace(/\bEl mapa\s+(fija|exige|define|vincula)\b/g, (_m, verb) => `El curso ${verb === 'fija' ? 'establece' : verb === 'exige' ? 'requiere' : verb === 'define' ? 'define' : 'relaciona'}`);
  text = text.replace(/\bel mapa\s+(fija|exige|define|vincula)\b/g, (_m, verb) => `el curso ${verb === 'fija' ? 'establece' : verb === 'exige' ? 'requiere' : verb === 'define' ? 'define' : 'relaciona'}`);
  text = text.replace(/\bla fuente superior\b/gi, 'el diseño del curso');
  text = text.replace(/\bla auditor[ií]a can[oó]nica del proyecto\b/gi, 'la base documental del curso');
  text = text.replace(/\barquitectura editorial\b/gi, 'estructura de la unidad');
  text = text.replace(/\bassets?\b/gi, 'materiales');
  text = text.replace(/\brenderer\b/gi, 'visor de partituras');
  text = text.replace(/\bcontrato MusicXML\b/gi, 'formato de partitura');
  text = text.replace(/\botros recursos J\b/gi, 'otros recursos rítmicos avanzados');
  text = text.replace(/^## Arquitectura\s*$/i, '## Recorrido de la unidad');
  text = text.replace(/\bla arquitectura ya fijada\b/gi, 'el recorrido ya definido');

  return tidyLine(text);
}

function transformMarkdownBody(body, context) {
  let inFence = false;
  return body.split('\n').map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    return inFence ? line : transformVisibleLine(line, context);
  }).join('\n');
}

function transformFrontmatter(frontmatter, unit) {
  return frontmatter.split('\n').map((line) => {
    const match = line.match(/^(title|summary|duration):(\s*)(.*)$/);
    if (!match) return line;
    const [, key, spacing, value] = match;
    const quote = value.startsWith('"') && value.endsWith('"') ? '"' : value.startsWith("'") && value.endsWith("'") ? "'" : '';
    const raw = quote ? value.slice(1, -1) : value;
    const transformed = transformVisibleLine(raw, { unit, field: key });
    return `${key}:${spacing}${quote}${transformed}${quote}`;
  }).join('\n');
}

function applyFileSpecificFixes(filename, body) {
  let text = body;

  if (filename === 'f2-u1-overview.md') {
    text = text.replace('## Recorrido aprobado de 20.U1', '## Recorrido de la unidad');
    text = text.replace('La unidad conserva la arquitectura ya fijada:', 'El recorrido es:');
    text = text.replace(
      'Las cinco piezas L1–L4 + CP forman ya el recorrido completo de 20.U1. Eso **cierra la arquitectura editorial de la unidad**, pero completar las páginas no equivale a “aprobar”: el checkpoint decide si conviene `CONTINUAR`, `CONTINUAR + CORRECTIVO`, `REDUCIR NOVEDAD` o `DETENER CARGA` según evidencia y salud/carga.',
      'Las cuatro lecciones y la evaluación forman el recorrido completo de la unidad. Completar las páginas no equivale a “aprobar”: la evaluación sirve para decidir si conviene `CONTINUAR`, `CONTINUAR + CORRECTIVO`, `REDUCIR NOVEDAD` o `DETENER CARGA` según la evidencia y la salud/carga.'
    );
  }

  if (filename === 'f6-u12-overview.md') {
    text = text.replace(
      '### Puerta B — Hito 7: Aprendiz autónomo\n\nEl mapa vincula Hito 7 con:\n\n`K1–K8 + E6 + F7`\n\nNo exige que todas esas competencias estén en nivel AVANZADO. La decisión debe apoyarse en evidencia conjunta y funcional.',
      '### Puerta B — Hito 7: Aprendiz autónomo\n\nPara el Hito 7 se observan conjuntamente las capacidades de práctica y autonomía, la transcripción y el análisis musical. No hace falta que todas alcancen nivel AVANZADO: la decisión se apoya en evidencia conjunta y funcional.'
    );
    text = text.replace(
      '- I3/I4/I5/I6, H7, C7, D7 y G3 ayudan a describir el **perfil de salida**;\n- una carencia de evidencia interpersonal real en I6 no invalida por sí sola Hito 7;',
      '- repertorio, transferencia entre estilos, interacción, independencia, microtiming, lectura aplicada y creatividad ayudan a describir el **perfil de salida**;\n- una carencia de evidencia interpersonal real no invalida por sí sola Hito 7;'
    );
    text = text.replace('## R1–R4 en el cierre', '## Los cuatro carriles del portafolio en el cierre');
    text = text.replace('### R1 — Escucha / transcripción', '### Escucha y transcripción');
    text = text.replace('### R2 — Chart / lectura', '### Chart y lectura');
    text = text.replace('### R3 — Transferencia estilística', '### Transferencia entre estilos');
    text = text.replace('### R4 — Proyecto autónomo', '### Proyecto autónomo');
    text = text.replace('## Comparación U1 → U12', '## Comparación entre la entrada y el cierre');
    text = text.replace('U1 abrió Fase 6 con:', 'La primera unidad abrió Fase 6 con:');
    text = text.replace('U12 vuelve a esa evidencia para preguntar:', 'Este cierre vuelve a esa evidencia para preguntar:');
    text = text.replace(/\n## Por qué 6I[\s\S]*?(?=\n## Fuentes y evidencia que U12 reutiliza)/, '\n');
    text = text.replace(
      'La autoridad curricular para el cierre sigue siendo: Plan General + mapa de competencias + sistema de evaluación + fuente aprobada de Fase 6.',
      'El cierre conserva las reglas ya establecidas en el Plan General y en el sistema de evaluación.'
    );
  }

  if (filename === 'f7-u7-overview.md') {
    text = text.replace(
      /## Nota técnica sobre las partituras de U7[\s\S]*?(?=\n## Arquitectura)/,
      '## Nota sobre las partituras\n\nLas dos capas se muestran sobre una línea temporal común. Sigue los acentos y etiquetas de cada métrica: las barras gráficas sirven como referencia visual y no sustituyen los ciclos propios de cada capa.\n'
    );
  }

  if (filename === 'f7-u8-checkpoint-7h.md') {
    text = text.replace(/`1[–-]5`/g, '`0–3`');
    text = text.replace(
      /(# Registro recomendado\n\nAnota después:\n)/,
      '$1\nSi utilizas escala observacional, conserva la del curso: `0 — no demostrado / 1 — emergente / 2 — estable en esta condición / 3 — flexible`. No la conviertas en una nota global.\n\n'
    );
  }

  if (filename === 'f7-u9-checkpoint-7i.md') {
    text = text.replace(
      /\| Competencia \| Estado observado ahora \| Próximo uso \|\n\|---\|---\|---\|[\s\S]*?\n\nLa tabla no crea una tercera escala ni obliga a que todas las filas coincidan\./,
      '| Capacidad | Nivel observado | Siguiente acción |\n|---|---|---|\n| Agrupaciones | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Desplazamientos | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Métricas impares y mixtas | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Tuplets | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Ciclos que cruzan compases | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Polirritmia | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Polimetría | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n| Modulación métrica | mínimo / funcional / avanzado | continuar / mantener / reforzar |\n\nEl nivel observado y la siguiente acción son dimensiones distintas: reforzar no es un nivel de competencia.'
    );
  }

  return text;
}

const filenames = (await readdir(pagesDir)).filter((name) => name.endsWith('.md')).sort();
let changedFiles = 0;

for (const filename of filenames) {
  const filepath = path.join(pagesDir, filename);
  const source = await readFile(filepath, 'utf8');
  const { before, frontmatter, body } = splitFrontmatter(source);
  const phase = Number(frontmatterValue(frontmatter, 'phase'));
  if (!Number.isInteger(phase) || phase < 1 || phase > 7) continue;
  const unit = Number(frontmatterValue(frontmatter, 'unit')) || 0;

  const nextFrontmatter = transformFrontmatter(frontmatter, unit);
  const preparedBody = applyFileSpecificFixes(filename, body);
  const nextBody = transformMarkdownBody(preparedBody, { unit, field: 'body' });
  const next = before ? `${before}${nextFrontmatter}\n---\n${nextBody}` : nextBody;

  if (next !== source) {
    await writeFile(filepath, next, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Learner-facing cleanup changed ${changedFiles} Markdown file(s).`);
