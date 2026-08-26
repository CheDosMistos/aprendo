import { stdin } from 'node:process';
import { openDatabase } from '../src/platform/data/database.ts';
import { applyMigrations } from '../src/platform/data/migrations.ts';
import {
  hashPassword,
  MAX_NEW_PASSWORD_LENGTH,
  MIN_NEW_PASSWORD_LENGTH,
} from '../src/platform/auth/authService.ts';

const STABLE_KEY_PATTERN = /^[A-Za-z0-9._-]{1,80}$/;

function parseStableKey(args: string[]): string {
  if (args.length !== 2 || args[0] !== '--stable-key' || !args[1]) {
    throw new Error('Uso: npm run reset-user-password -- --stable-key <id>');
  }
  if (!STABLE_KEY_PATTERN.test(args[1])) throw new Error('stable-key no válido.');
  return args[1];
}

async function readPassword(): Promise<string> {
  if (stdin.isTTY) {
    throw new Error('La contraseña debe recibirse por stdin para evitar que quede en el historial del shell.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/, '');
}

export function resetUserPassword(stableKey: string, password: string, databasePath?: string): void {
  if (!STABLE_KEY_PATTERN.test(stableKey)) throw new Error('stable-key no válido.');
  if (password.length < MIN_NEW_PASSWORD_LENGTH || password.length > MAX_NEW_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener entre ${MIN_NEW_PASSWORD_LENGTH} y ${MAX_NEW_PASSWORD_LENGTH} caracteres.`);
  }

  const database = openDatabase(databasePath ? { path: databasePath } : {});
  try {
    applyMigrations(database);
    database.exec('BEGIN IMMEDIATE;');
    try {
      const user = database.prepare(`
        SELECT id, username
        FROM app_users
        WHERE stable_key = ?
        LIMIT 1
      `).get(stableKey) as { id: number; username: string | null } | undefined;

      if (!user) throw new Error(`No existe ningún usuario con stable-key ${stableKey}.`);

      database.prepare('UPDATE app_users SET password_hash = ? WHERE id = ?')
        .run(hashPassword(password), user.id);
      database.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(user.id);
      database.exec('COMMIT;');
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  } finally {
    database.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const stableKey = parseStableKey(process.argv.slice(2));
    const password = await readPassword();
    resetUserPassword(stableKey, password);
    console.log(`Contraseña de ${stableKey} actualizada y sesiones anteriores revocadas.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
    process.exitCode = 1;
  }
}
