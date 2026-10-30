import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ApiError } from './errors.js';

/** Repositorio SQLite: separa la persistencia de las reglas de autenticación. */
export class UserRepository {
  constructor(databasePath) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY,
        usuario TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        creado_en TEXT NOT NULL
      ) STRICT;
    `);
    // Los valores siempre se enlazan como parámetros, nunca se concatenan al SQL.
    this.findStatement = this.database.prepare('SELECT * FROM usuarios WHERE usuario = ?');
    this.insertStatement = this.database.prepare(
      'INSERT INTO usuarios (usuario, password_hash, creado_en) VALUES (?, ?, ?)',
    );
  }

  findByUsername(username) {
    return this.findStatement.get(username);
  }

  create(username, passwordHash) {
    try {
      this.insertStatement.run(username, passwordHash, new Date().toISOString());
    } catch (error) {
      // Una restricción UNIQUE resuelve también dos registros concurrentes.
      if (error.errcode === 2067) throw new ApiError(409, 'El usuario ya está registrado.');
      throw error;
    }
    return this.findByUsername(username);
  }

  close() {
    this.database.close();
  }
}

