import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const pagesDir = path.resolve('src/courses/bateria/content/pages');

const checks = [
  ['competency-id', /\b[A-K][1-9](?:-(?:R|F|C))?\b/g],
  ['unit-document-id', /\b(?:10|20|30|40|50|60|70)\.U\d+\b/g],
  ['unit-shorthand', /\bU(?:1[0-2]|[1-9])\b/g],
  ['lesson-shorthand', /\bL[1-9]\b/g],
  ['checkpoint-code', /\bCheckpoint\s+\d+[A-I]\b/gi],
  ['checkpoint-letter-code', /\b[1-7][A-I]\b/g],
  ['checkpoint-word', /\bcheckpoints?\b/gi],
  ['checkpoint-shorthand', /\bCP\b/g],
  ['gate-id', /\bP[1-9]\b/g],
  ['portfolio-code', /\bR[1-4]\b/g],
  ['internal-editorial-language', /\b(?:mapa aprobado|mapa de competencias|fuente superior|fuente aprobada|auditor[ií]a can[oó]nica|arquitectura editorial|contrato MusicXML|renderer|assets?|Biblioteca Maestra|Plan General|Documento Fundacional)\b/gi],
  ['editorial-heading', /^##\s+Arquitectura\b/gi],
  ['codemod-artifact', /\$1|\bel Evaluación\b|\beste Evaluación\b|\bde la unidad de la unidad\b|\bLección \d+\s*[–-]\s*Lección \d+\b|\bUnidad \d+\s*[–-]\s*Unidad \d+\b/g],
  ['lowercase-self-reference', /^(?:esta unidad|el curso|la base documental|el diseño del curso)\b/g],
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

const filenames = (await readdir(pagesDir)).filter((name) => name.endsWith('.md')).sort();
const findings = [];

for (const filename of filenames) {
  const source = await readFile(path.join(pagesDir, filename), 'utf8');
  const { frontmatter, body } = splitFrontmatter(source);
  const phase = Number(frontmatterValue(frontmatter, 'phase'));
  if (!Number.isInteger(phase) || phase < 1 || phase > 7) continue;

  const visible = [
    `title: ${frontmatterValue(frontmatter, 'title')}`,
    `summary: ${frontmatterValue(frontmatter, 'summary')}`,
    `duration: ${frontmatterValue(frontmatter, 'duration')}`,
    body,
  ].join('\n');

  const lines = visible.split('\n');
  lines.forEach((line, index) => {
    for (const [kind, regex] of checks) {
      regex.lastIndex = 0;
      const matches = [...line.matchAll(regex)].map((match) => match[0]);
      if (matches.length) findings.push({ phase, filename, line: index + 1, kind, matches, text: line.trim() });
    }
  });
}

const byPhase = new Map();
for (const finding of findings) byPhase.set(finding.phase, (byPhase.get(finding.phase) ?? 0) + 1);

console.log(`Learner-language audit: ${findings.length} finding(s).`);
for (let phase = 1; phase <= 7; phase += 1) console.log(`Fase ${phase}: ${byPhase.get(phase) ?? 0}`);
for (const finding of findings) console.log(`${finding.filename}:${finding.line} [${finding.kind}] ${finding.matches.join(', ')} :: ${finding.text}`);

if (process.argv.includes('--enforce') && findings.length) {
  console.error('\nInternal curricular/editorial identifiers or cleanup artifacts leaked into learner-visible content.');
  process.exitCode = 1;
}
