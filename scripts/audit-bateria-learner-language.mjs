import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const pagesDir = path.resolve('src/courses/bateria/content/pages');
const maxPhase = Number(process.env.BATERIA_LEARNER_LANGUAGE_MAX_PHASE ?? 7);

const checks = [
  // Dependency suffixes are curricular and unambiguous.
  ['competency-dependency-id', /\b[A-K][1-9]-(?:R|F|C)\b/g],
  // H–K are not pitch names; bare A–G + digit can be legitimate pitch notation (C2, A4, etc.).
  ['competency-id-unambiguous', /\b[H-K][1-9]\b/g],
  // Catch ambiguous A–G competency IDs only in clearly curricular/editorial contexts.
  ['competency-id-contextual', /(?:\bcompetencias?\s+|\bprerrequisitos?\s+|\bpara superar\s+|\bdepende de\s+|\brequiere\s+|\/\s*)[A-G][1-9]\b/gi],
  ['competency-id-list', /\b[A-G][1-9](?:\s*[,/]\s*[A-K][1-9])+(?:\s*(?:y|e)\s*[A-K][1-9])?\b/g],
  ['unit-document-id', /\b(?:10|20|30|40|50|60|70)\.U\d+\b/g],
  ['unit-shorthand', /\bU(?:1[0-2]|[1-9])\b/g],
  ['lesson-shorthand', /\bL[1-9]\b/g],
  ['checkpoint-code', /\bCheckpoint\s+\d+[A-I]\b/gi],
  ['checkpoint-word', /\bcheckpoints?\b/gi],
  ['checkpoint-shorthand', /\bCP\b/g],
  ['gate-id', /\bP[1-9]\b/g],
  ['portfolio-code', /\bR[1-4]\b/g],
  ['internal-editorial-language', /\b(?:mapa aprobado|mapa de competencias|fuente superior|fuente aprobada|auditor[ií]a can[oó]nica|arquitectura editorial|contrato MusicXML|renderer|assets?|Biblioteca Maestra|Plan General|Documento Fundacional)\b/gi],
  ['editorial-heading', /^##\s+Arquitectura\b/gi],
  ['codemod-artifact', /\$1|\bel Evaluación\b|\beste Evaluación\b|\bde la unidad de la unidad\b|\bLección \d+\s*[–-]\s*Lección \d+\b|\bUnidad \d+\s*[–-]\s*Unidad \d+\b|\bUnidad \d+\.(?:Lección|evaluación)\b/g],
  ['semantic-artifact', /\b(?:bombo bombo|hi-hat de pie hi-hat de pie|coordinación básica de cuatro extremidades coordinación de cuatro extremidades|groove y variaciones groove|groove groove y variaciones|fills fills|independencia avanzada independencia(?: avanzada)?|integración de integración|adaptación\/orquestación adaptación|improvisación restringida orquestación creativa|orquestación creativa improvisación restringida|orquestación de rudimentos\/orquestación focal|una base coordinación básica|todos los evaluaciones|todos las evaluaciones|todas los evaluaciones|los evaluaciones|las evaluación|Auditoría los cuatro carriles|conforme al mapa|que fija el mapa|no de toda figuras, silencios y compás)\b/gi],
];

const rawChecks = [
  ['mutated-score-url', /data-score-(?:src|source-url)="[^"]*(?:-Evaluación-|\/Evaluación-)[^"]*\.musicxml"/g],
];

function splitFrontmatter(source) {
  if (!source.startsWith('---\n')) return { frontmatter: '', body: source };
  const end = source.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: source };
  return { frontmatter: source.slice(4, end), body: source.slice(end + 5) };
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function stripNonVisibleMarkdown(source) {
  return source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/^ {4}.*$/gm, '')
    .replace(/`[^`\n]+`/g, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\]\((?:[^()]|\([^)]*\))*\)/g, ']');
}

const filenames = (await readdir(pagesDir)).filter((name) => name.endsWith('.md')).sort();
const findings = [];

for (const filename of filenames) {
  const source = await readFile(path.join(pagesDir, filename), 'utf8');
  const { frontmatter, body } = splitFrontmatter(source);
  const phase = Number(frontmatterValue(frontmatter, 'phase'));
  if (!Number.isInteger(phase) || phase < 1 || phase > maxPhase) continue;

  const scoreTitles = [...body.matchAll(/data-score-title="([^"]+)"/g)].map((match) => match[1]);
  const visibleBody = stripNonVisibleMarkdown(body.replace(/<[^>]+>/g, ''));
  const visible = [
    `title: ${frontmatterValue(frontmatter, 'title')}`,
    `summary: ${frontmatterValue(frontmatter, 'summary')}`,
    `duration: ${frontmatterValue(frontmatter, 'duration')}`,
    ...scoreTitles.map((title) => `score-title: ${title}`),
    visibleBody,
  ].join('\n');

  const lines = visible.split('\n');
  lines.forEach((line, index) => {
    for (const [kind, regex] of checks) {
      regex.lastIndex = 0;
      const matches = [...line.matchAll(regex)].map((match) => match[0]);
      if (matches.length) findings.push({ phase, filename, line: index + 1, kind, matches, text: line.trim() });
    }
  });

  source.split('\n').forEach((line, index) => {
    for (const [kind, regex] of rawChecks) {
      regex.lastIndex = 0;
      const matches = [...line.matchAll(regex)].map((match) => match[0]);
      if (matches.length) findings.push({ phase, filename, line: index + 1, kind, matches, text: line.trim() });
    }
  });
}

const byPhase = new Map();
for (const finding of findings) byPhase.set(finding.phase, (byPhase.get(finding.phase) ?? 0) + 1);

console.log(`Learner-language audit: ${findings.length} finding(s), phases 1–${maxPhase}.`);
for (let phase = 1; phase <= maxPhase; phase += 1) console.log(`Fase ${phase}: ${byPhase.get(phase) ?? 0}`);
for (const finding of findings) console.log(`${finding.filename}:${finding.line} [${finding.kind}] ${finding.matches.join(', ')} :: ${finding.text}`);

if (process.argv.includes('--enforce') && findings.length) {
  console.error('\nInternal curricular/editorial identifiers or cleanup artifacts leaked into learner-visible content.');
  process.exitCode = 1;
}
