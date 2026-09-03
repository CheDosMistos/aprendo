import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src/courses/bateria/content/pages');
const repairs = new Map([
  ['f7-u8-checkpoint-7h.md', [
    ['title: "Evaluación — modulación métrica funcional: modulación métrica calculable y audible"', 'title: "Evaluación — Modulación métrica: relación calculable y audible"'],
    ['summary: "Evalúa modulación métrica sin reducirlo a BPM:', 'summary: "Evalúa la modulación métrica sin reducirla a BPM:'],
    ['Además, el documento de evaluación establece explícitamente:', 'Además, la regla general del curso establece explícitamente:'],
  ]],
  ['f7-u9-checkpoint-7i.md', [
    ['title: "Evaluación — integración progresiva y experimental funcional y Hito 8"', 'title: "Evaluación — Integración progresiva y Hito 8"'],
    ['summary: "Cierra Fase 7 evaluando integración progresiva mediante', 'summary: "Cierra Fase 7 evaluando la integración progresiva mediante'],
    ['## Auditoría los recursos rítmicos trabajados en las unidades anteriores', '## Revisión de los recursos rítmicos trabajados en las unidades anteriores'],
  ]],
]);

let changed = 0;
for (const [filename, pairs] of repairs) {
  const filepath = path.join(root, filename);
  let text = await readFile(filepath, 'utf8');
  const before = text;
  for (const [from, to] of pairs) text = text.split(from).join(to);
  if (text !== before) {
    await writeFile(filepath, text, 'utf8');
    changed += 1;
  }
}

console.log(`Final F7 learner-wording repair changed ${changed} file(s).`);
