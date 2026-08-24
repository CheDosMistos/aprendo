import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DEFAULT_AVATAR_DIR = '/var/lib/aprendo/avatars';
export const MAX_AVATAR_BYTES = 50 * 1024;
export const AVATAR_SIZE = 100;

export function saveAvatar(userId: number, bytes: Uint8Array): string {
  if (bytes.byteLength < 24 || bytes.byteLength > MAX_AVATAR_BYTES) {
    throw new Error('El avatar procesado no tiene un tamaño válido.');
  }
  const dimensions = readWebpDimensions(bytes);
  if (!dimensions || dimensions.width !== AVATAR_SIZE || dimensions.height !== AVATAR_SIZE) {
    throw new Error(`El avatar debe ser WebP de ${AVATAR_SIZE}×${AVATAR_SIZE} px.`);
  }

  const path = avatarPath(userId);
  mkdirSync(dirname(path), { recursive: true, mode: 0o750 });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(temporary, bytes, { mode: 0o640 });
    renameSync(temporary, path);
  } catch (error) {
    try { unlinkSync(temporary); } catch {}
    throw error;
  }
  return Date.now().toString(36);
}

export function readAvatar(userId: number): Buffer | null {
  try {
    return readFileSync(avatarPath(userId));
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

export function removeAvatar(userId: number): void {
  try {
    unlinkSync(avatarPath(userId));
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }
}

export function readWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > buffer.length) return null;

    if (type === 'VP8X' && size >= 10) {
      return {
        width: 1 + readUInt24LE(buffer, data + 4),
        height: 1 + readUInt24LE(buffer, data + 7),
      };
    }

    if (type === 'VP8 ' && size >= 10 && buffer[data + 3] === 0x9d && buffer[data + 4] === 0x01 && buffer[data + 5] === 0x2a) {
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff,
      };
    }

    if (type === 'VP8L' && size >= 5 && buffer[data] === 0x2f) {
      const b0 = buffer[data + 1];
      const b1 = buffer[data + 2];
      const b2 = buffer[data + 3];
      const b3 = buffer[data + 4];
      return {
        width: 1 + b0 + ((b1 & 0x3f) << 8),
        height: 1 + ((b1 & 0xc0) >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
      };
    }

    offset = data + size + (size % 2);
  }
  return null;
}

function avatarPath(userId: number): string {
  const directory = process.env.APRENDO_AVATAR_DIR ?? DEFAULT_AVATAR_DIR;
  return join(directory, `${userId}.webp`);
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
