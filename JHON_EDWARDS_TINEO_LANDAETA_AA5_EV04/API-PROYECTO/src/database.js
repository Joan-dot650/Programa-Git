import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/** Una base por aplicación; todas las consultas de valores usan parámetros. */
export class Store {
  constructor(path = ':memory:') {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.function('minusculas_es', { deterministic: true }, (value) => value.toLocaleLowerCase('es'));
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
    this.db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  }
  one(sql, ...params) { return this.db.prepare(sql).get(...params); }
  all(sql, ...params) { return this.db.prepare(sql).all(...params); }
  run(sql, ...params) { return this.db.prepare(sql).run(...params); }

  /** Sin await dentro: la reserva de inventario y el pedido son una sola unidad. */
  transaction(work) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  close() { this.db.close(); }
}
