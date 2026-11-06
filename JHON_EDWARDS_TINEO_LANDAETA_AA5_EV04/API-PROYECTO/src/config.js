import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const databasePath = () => process.env.DB_PATH
  ? resolve(process.env.DB_PATH) : fileURLToPath(new URL('../data/raizvolt.sqlite', import.meta.url));
