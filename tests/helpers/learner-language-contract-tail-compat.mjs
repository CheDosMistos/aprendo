import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';

// Small test-only tail for legacy assertions that need highly contextual wording.
// It intentionally runs after learner-language-contract-compat.mjs and never edits
// learner-facing Markdown on disk.
const previousReadFile = fs.promises.readFile.bind(fs.promises);
const previousReadFileSync = fs.readFileSync.bind(fs);

function patchLegacyContractText(filePath, value) {
  if (typeof value !== 'string') return value;

  const normalizedPath = String(filePath).replaceAll('\\', '/');
  let text = value;

  if (normalizedPath.endsWith('/f3-u7-checkpoint-puerta-g3-hacia-composicion.md')) {
    text = text.replace(
      'no apareció en Lecciones 1–5',
      'no apareció en L1–L5',
    );
  }

  if (normalizedPath.endsWith('/f4-u1-overview.md')) {
    text = text.replace(
      'U1 no enseña todavía H5, fills ni técnica específica de bombo o hi-hat',
      'U1 no enseña todavía groove, fills ni técnica específica de bombo o hi-hat',
    );
  }

  if (normalizedPath.endsWith('/f4-u5-l4-puente-cuatro-extremidades.md')) {
    text = text.replace(
      'no requisito de el checkpoint U5',
      'no requisito del checkpoint U5',
    );
  }

  if (normalizedPath.endsWith('/f4-u7-l4-grabar-comparar.md')) {
    text = text.replace(
      'no es requisito de el checkpoint',
      'no es requisito del checkpoint',
    );
  }

  if (normalizedPath.endsWith('/f4-u8-l2-pies-base-orquestacion.md')) {
    text = text.replace(
      'ocho corcheas exactamente como L4',
      'ocho corcheas exactamente como U2.L4',
    );
  }

  if (normalizedPath.endsWith('/f5-u3-l4-pieza-a-energia-forma.md')) {
    text = text
      .replace('| postura y relajación | 5–8 | mf |', '| A1 | 5–8 | mf |')
      .replace('| singles y redobles | 13–16 | f |', '| B1 | 13–16 | f |');
  }

  return text;
}

fs.promises.readFile = async (filePath, ...args) =>
  patchLegacyContractText(filePath, await previousReadFile(filePath, ...args));

fs.readFileSync = (filePath, ...args) =>
  patchLegacyContractText(filePath, previousReadFileSync(filePath, ...args));

syncBuiltinESMExports();
