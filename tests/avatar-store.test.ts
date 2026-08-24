import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { AVATAR_SIZE, readAvatar, readWebpDimensions, removeAvatar, saveAvatar } from '../src/platform/auth/avatarStore.ts';

function vp8x(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(22, 4);
  buffer.write('WEBP', 8, 'ascii');
  buffer.write('VP8X', 12, 'ascii');
  buffer.writeUInt32LE(10, 16);
  const w = width - 1;
  const h = height - 1;
  buffer[24] = w & 0xff; buffer[25] = (w >> 8) & 0xff; buffer[26] = (w >> 16) & 0xff;
  buffer[27] = h & 0xff; buffer[28] = (h >> 8) & 0xff; buffer[29] = (h >> 16) & 0xff;
  return buffer;
}

test('avatar validator accepts only the canonical 100x100 WebP dimensions', () => {
  assert.deepEqual(readWebpDimensions(vp8x(AVATAR_SIZE, AVATAR_SIZE)), { width: 100, height: 100 });
  assert.throws(() => saveAvatar(1, vp8x(120, 100)), /100×100/);
});

test('avatar storage writes only the processed WebP into the persistent avatar directory', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aprendo-avatar-'));
  const previous = process.env.APRENDO_AVATAR_DIR;
  process.env.APRENDO_AVATAR_DIR = directory;
  try {
    const data = vp8x(100, 100);
    const version = saveAvatar(7, data);
    assert.ok(version.length > 0);
    assert.deepEqual(readAvatar(7), data);
    removeAvatar(7);
    assert.equal(readAvatar(7), null);
  } finally {
    if (previous === undefined) delete process.env.APRENDO_AVATAR_DIR;
    else process.env.APRENDO_AVATAR_DIR = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});
