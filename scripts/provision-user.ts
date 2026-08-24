import { stdin } from 'node:process';
import { openDatabase } from '../src/platform/data/database.ts';
import { applyMigrations } from '../src/platform/data/migrations.ts';
import {
  hashPassword,
  MAX_NEW_PASSWORD_LENGTH,
  MIN_NEW_PASSWORD_LENGTH,
  type UserRole,
} from '../src/platform/auth/authService.ts';

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,40}$/u;
const STABLE_KEY_PATTERN = /^[A-Za-z0-9._-]{1,80}$/;

interface ProvisionInput {
  stableKey: string;
  username: string;
  displayName: string | null;
  role: UserRole;
}

function parseArguments(args: string[]): ProvisionInput {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith('--') || value === undefined) {
      throw new Error('Uso: npm run provision-user -- --stable-key <id> --username <login> [--display-name <nombre>] [--role student|admin]');
    }
    values.set(flag, value);
  }

  const stableKey = values.get('--stable-key') ?? '';
  const username = values.get('--username') ?? '';
  const displayName = values.get('--display-name')?.trim() || null;
  const role = (values.get('--role') ?? 'student') as UserRole;

  if (!STABLE_KEY_PATTERN.test(stableKey)) throw new Error('stable-key no válido.');
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('El login debe tener entre 3 y 40 caracteres y usar solo letras, números, punto, guion o guion bajo.');
  }
  if (role !== 'student' && role !== 'admin') throw new Error('El rol debe ser student o admin.');
  if (displayName && displayName.length > 120) throw new Error('El nombre visible es demasiado largo.');

  return { stableKey, username, displayName, role };
}

async function readPassword(): Promise<string> {
  if (stdin.isTTY) {
    throw new Error('La contraseña debe recibirse por stdin para evitar que quede en el historial del shell.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/, '');
}

export async function provisionUser(input: ProvisionInput, password: string): Promise<void> {
  if (password.length < MIN_NEW_PASSWORD_LENGTH || password.length > MAX_NEW_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener entre ${MIN_NEW_PASSWORD_LENGTH} y ${MAX_NEW_PASSWORD_LENGTH} caracteres.`);
  }

  const database = openDatabase();
  try {
    applyMigrations(database);
    database.exec('BEGIN IMMEDIATE;');
    try {
      const existing = database.prepare(`
        SELECT id, password_hash
        FROM app_users
        WHERE stable_key = ?
        LIMIT 1
      `).get(input.stableKey) as { id: number; password_hash: string | null } | undefined;

      if (existing?.password_hash) {
        throw new Error('El usuario ya tiene contraseña. Cámbiala desde la cuenta; la provisión no sobrescribe credenciales existentes.');
      }

      const collision = database.prepare(`
        SELECT stable_key
        FROM app_users
        WHERE username = ? COLLATE NOCASE AND stable_key <> ?
        LIMIT 1
      `).get(input.username, input.stableKey) as { stable_key: string } | undefined;
      if (collision) throw new Error('Ese login ya está en uso.');

      const passwordHash = hashPassword(password);
      if (existing) {
        database.prepare(`
          UPDATE app_users
          SET username = ?, display_name = ?, role = ?, password_hash = ?
          WHERE stable_key = ?
        `).run(input.username, input.displayName, input.role, passwordHash, input.stableKey);
      } else {
        database.prepare(`
          INSERT INTO app_users (stable_key, display_name, username, password_hash, role)
          VALUES (?, ?, ?, ?, ?)
        `).run(input.stableKey, input.displayName, input.username, passwordHash, input.role);
      }

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
    const input = parseArguments(process.argv.slice(2));
    const password = await readPassword();
    await provisionUser(input, password);
    console.log(`Usuario ${input.username} provisionado correctamente.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'No se pudo provisionar el usuario.');
    process.exitCode = 1;
  }
}
