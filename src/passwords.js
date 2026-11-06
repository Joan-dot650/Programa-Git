import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELISM = 5;
const KEY_LENGTH = 64;

/** Sal individual: dos cuentas con la misma contraseña tienen hashes distintos. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 64 * 1024 * 1024,
  });
  return ['scrypt', COST, BLOCK_SIZE, PARALLELISM, salt, key.toString('hex')].join('$');
}

/** Los parámetros se comprueban antes de derivar para rechazar datos corruptos. */
export async function verifyPassword(password, encoded) {
  const parts = encoded.split('$');
  const [algorithm, cost, blockSize, parallelism, salt, hash] = parts;
  if (parts.length !== 6 || algorithm !== 'scrypt' || Number(cost) !== COST
    || Number(blockSize) !== BLOCK_SIZE || Number(parallelism) !== PARALLELISM
    || !/^[0-9a-f]{32}$/.test(salt) || !/^[0-9a-f]{128}$/.test(hash)) {
    return false;
  }
  const actual = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(Buffer.from(hash, 'hex'), actual);
}

