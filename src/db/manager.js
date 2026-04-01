import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

/**
 * Ensures a single database instance is used (Singleton pattern).
 * Sets up Pragmas for performance and ACID compliance.
 * Reads logic from schema.sql.
 * 
 * @param {string} dbPath - File path to sqlite db or ':memory:'
 * @param {boolean} loadSchema - Whether to load schema on init
 * @returns {Database} The initialized better-sqlite3 database instance
 */
export function getDb(dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : 'data.sqlite', loadSchema = true) {
  if (dbInstance) return dbInstance;
  
  const isMemory = dbPath === ':memory:' || dbPath.startsWith(':memory:');

  // Ensure the directory exists if it's a file path
  if (!isMemory) {
    const dir = path.dirname(dbPath);
    // Even if dbPath is relative like 'data.sqlite', path.dirname('data.sqlite') is '.'
    if (dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Initialize DB
  dbInstance = new Database(dbPath);
  
  // Pragmas for performance and enforcing foreign keys (ACID bounds)
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('synchronous = NORMAL');
  dbInstance.pragma('foreign_keys = ON');
  
  // Conditionally load the initial schema
  if (loadSchema) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      dbInstance.exec(schemaSql);
    }
  }
  
  return dbInstance;
}

/**
 * Cleanly closes the existing connection if any.
 */
export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * General purpose transaction helper to wrap complex logic in an ACID transaction.
 * @param {Function} callback - Function that executes SQL commands
 * @returns {*} Result of the callback
 */
export function executeTransaction(callback) {
  if (!dbInstance) {
    throw new Error("Database is not initialized. Call getDb() first.");
  }
  const transaction = dbInstance.transaction(callback);
  return transaction();
}

/**
 * Basic CRUD helpers for 'pacientes' to satisfy Task 02 criteria.
 */
export const insertPaciente = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO pacientes (cedula_rif, nombre, sexo, fecha_nacimiento, telefono, correo, direccion)
    VALUES (@cedula_rif, @nombre, @sexo, @fecha_nacimiento, @telefono, @correo, @direccion)
  `);
  return stmt.run(data);
};

export const getPacienteByCedula = (cedula_rif) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM pacientes WHERE cedula_rif = ?');
  return stmt.get(cedula_rif);
};

export const searchPatients = (query) => {
  const db = getDb();
  if (!query) return getAllPatients();
  const target = `%${query}%`;
  const stmt = db.prepare('SELECT * FROM pacientes WHERE nombre LIKE ? OR cedula_rif LIKE ? LIMIT 50');
  return stmt.all(target, target);
};

export const getAllPatients = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM pacientes ORDER BY created_at DESC LIMIT 100');
  return stmt.all();
};
