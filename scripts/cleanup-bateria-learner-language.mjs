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
  return {
    before: '---\n',
    frontmatter: source.slice(4, end),
    body: source.slice(end + 5),
  };
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function stripCompetencyPrefix(text) {
  let result = text;
  for (const id of Object.keys(competencyNames)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escaped}(?:-(?:R|F|C))?\\s*[—–-]\\s*(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])`, 'g'), '');
  }
  return result;
}

function transformVisible(input, { unit = 0, field = 'body' } = {}) {
  let text = input;

  // Document/editorial numbering is useful internally, but not to the learner.
  if (field === 'title') {
    text = text.replace(/^['"]?(?:10|20|30|40|50|60|70)\.U\d+\s*[—–:-]\s*/i, (match) => match.startsWith('"') || match.startsWith("'") ? match[0] : '');
  }
  text = text.replace(/\b(?:10|20|30|40|50|60|70)\.U(\d+)\b/g, 'Unidad $1');
  text = text.replace(/\bCheckpoint\s+\d+[A-I]\b/gi, 'Evaluación');
  text = text.replace(/\bCheckpoint\b/gi, 'Evaluación');
  text = text.replace(/\bCP\b/g, 'evaluación');
  text = text.replace(/\b(?:la\s+)?Puerta\s+P[1-9]\b/gi, 'la puerta de entrada de la fase');
  text = text.replace(/\bP[1-9]\b/g, 'puerta de entrada');

  // Frequently used ranges are clearer when named by function rather than database IDs.
  text = text.replace(/\bJ1\s*[–-]\s*J9\b/g, 'los recursos rítmicos avanzados de esta fase');
  text = text.replace(/\bJ1\s*[–-]\s*J8\b/g, 'los recursos rítmicos trabajados en las unidades anteriores');
  text = text.replace(/\bK1\s*[–-]\s*K8\b/g, 'las capacidades de práctica y autonomía');
  text = text.replace(/\bC1\s*[–-]\s*C3\b/g, 'pulso, subdivisión y cambios de subdivisión');
  text = text.replace(/\bR1\s*[–-]\s*R4\b/g, 'los cuatro carriles del portafolio');

  // When a code already precedes its readable label, preserve the label and remove only the code.
  text = stripCompetencyPrefix(text);

  // Remaining competency IDs become the actual skill/concept name.
  for (const [id, label] of Object.entries(competencyNames)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`\\b${escaped}(?:-(?:R|F|C))?\\b`, 'g'), label);
  }

  // Portfolio lane IDs become descriptive names.
  for (const [id, label] of Object.entries(portfolioNames)) {
    text = text.replace(new RegExp(`\\b${id}\\b`, 'g'), label);
  }

  // Unit/lesson shorthand is expanded. Current-unit self-references become natural prose.
  if (unit) {
    text = text.replace(new RegExp(`\\bU${unit}\\b`, 'g'), 'esta unidad');
  }
  text = text.replace(/\bU(1[0-2]|[1-9])\b/g, 'Unidad $1');
  text = text.replace(/\bL([1-9])\b/g, 'Lección $1');

  // Bare checkpoint suffixes such as “6I” are editorial IDs, not learner concepts.
  text = text.replace(/\b[1-7][A-I]\b/g, 'evaluación final');

  // Internal project prose becomes learner-oriented prose.
  text = text.replace(/\bel mapa aprobado\b/gi, 'el recorrido del curso');
  text = text.replace(/\bel mapa de competencias\b/gi, 'el recorrido del curso');
  text = text.replace(/\bel mapa\s+(?:fija|exige|define)\b/gi, 'el curso $1');
  text = text.replace(/\bla fuente superior\b/gi, 'el diseño del curso');
  text = text.replace(/\bla auditor[ií]a can[oó]nica del proyecto\b/gi, 'la base documental del curso');
  text = text.replace(/\barquitectura editorial\b/gi, 'estructura de la unidad');
  text = text.replace(/\bassets?\b/gi, 'materiales');
  text = text.replace(/\brenderer\b/gi, 'visor de partituras');
  text = text.replace(/\bcontrato MusicXML\b/gi, 'formato de partitura');
  text = text.replace(/\botros recursos J\b/gi, 'otros recursos rítmicos avanzados');

  // Small readability repairs after substitutions.
  text = text.replace(/\bEn esta unidad\s+esta unidad\b/g, 'En esta unidad');
  text = text.replace(/\bde esta unidad\s+esta unidad\b/g, 'de esta unidad');
  text = text.replace(/\bla esta unidad\b/g, 'esta unidad');
  text = text.replace(/\bel esta unidad\b/g, 'esta unidad');
  text = text.replace(/\bUnidad\s+esta unidad\b/g, 'esta unidad');
  text = text.replace(/\s+([,.;:])/g, '$1');
  text = text.replace(/ {2,}/g, ' ');

  return text;
}

function transformFrontmatter(frontmatter, unit) {
  return frontmatter.split('\n').map((line) => {
    const match = line.match(/^(title|summary):(\s*)(.*)$/);
    if (!match) return line;
    const [, key, spacing, value] = match;
    const quote = value.startsWith('"') && value.endsWith('"') ? '"' : value.startsWith("'") && value.endsWith("'") ? "'" : '';
    const raw = quote ? value.slice(1, -1) : value;
    let transformed = transformVisible(raw, { unit, field: key });
    if (key === 'title') {
      transformed = transformed.replace(/^(?:10|20|30|40|50|60|70)\.Unidad\s+\d+\s*[—–:-]\s*/i, '');
    }
    return `${key}:${spacing}${quote}${transformed}${quote}`;
  }).join('\n');
}

function applyFileSpecificFixes(filename, body) {
  let text = body;

  if (filename === 'f7-u7-overview.md') {
    text = text.replace(
      /## Nota técnica sobre las partituras de esta unidad[\s\S]*?(?=\n## Arquitectura)/,
      '## Nota sobre las partituras\n\nLas dos capas se muestran sobre una línea temporal común. Sigue los acentos y etiquetas de cada métrica: las barras gráficas sirven como referencia visual y no sustituyen los ciclos propios de cada capa.\n\n'
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
  let nextBody = transformVisible(body, { unit, field: 'body' });
  nextBody = applyFileSpecificFixes(filename, nextBody);

  const next = before ? `${before}${nextFrontmatter}\n---\n${nextBody}` : nextBody;
  if (next !== source) {
    await writeFile(filepath, next, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Learner-facing cleanup changed ${changedFiles} Markdown file(s).`);
