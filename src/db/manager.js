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

/**
 * Basic CRUD helpers for 'medicos'.
 */
export const insertMedico = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO medicos (nombre, cedula_rif, telefono, correo, especialidad, porcentaje_comision, activo)
    VALUES (@nombre, @cedula_rif, @telefono, @correo, @especialidad, @porcentaje_comision, 1)
  `);
  return stmt.run(data);
};

export const updateMedico = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE medicos 
    SET nombre = @nombre, 
        cedula_rif = @cedula_rif, 
        telefono = @telefono, 
        correo = @correo, 
        especialidad = @especialidad, 
        porcentaje_comision = @porcentaje_comision
    WHERE id = @id
  `);
  return stmt.run(data);
};

export const deactivateMedico = (id) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE medicos SET activo = 0 WHERE id = ?');
  return stmt.run(id);
};

export const searchMedicos = (query) => {
  const db = getDb();
  if (!query) return getAllMedicos();
  const target = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM medicos 
    WHERE activo = 1 
    AND (nombre LIKE ? OR cedula_rif LIKE ? OR especialidad LIKE ?) 
    LIMIT 50
  `);
  return stmt.all(target, target, target);
};

export const getAllMedicos = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM medicos WHERE activo = 1 ORDER BY nombre ASC LIMIT 100');
  return stmt.all();
};

/**
 * CRUD helpers for 'insumos'.
 */
export const insertInsumo = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO insumos (nombre, stock_actual, stock_minimo, unidad_medida, costo_unitario_usd)
    VALUES (@nombre, @stock_actual, @stock_minimo, @unidad_medida, @costo_unitario_usd)
  `);
  return stmt.run(data);
};

export const getAllInsumos = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM insumos ORDER BY nombre ASC LIMIT 100');
  return stmt.all();
};

export const getInsumoById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM insumos WHERE id = ?');
  return stmt.get(id);
};

export const updateInsumo = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE insumos 
    SET nombre = @nombre, 
        stock_actual = @stock_actual, 
        stock_minimo = @stock_minimo, 
        unidad_medida = @unidad_medida, 
        costo_unitario_usd = @costo_unitario_usd
    WHERE id = @id
  `);
  return stmt.run(data);
};

/**
 * CRUD helpers for 'servicios' with transaction-safe relation management.
 */
export const insertServicio = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO servicios (nombre, precio_usd, es_exento, id_medico_defecto)
    VALUES (@nombre, @precio_usd, @es_exento, @id_medico_defecto)
  `);
  return stmt.run(data);
};

export const updateServicio = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE servicios 
    SET nombre = @nombre, 
        precio_usd = @precio_usd, 
        es_exento = @es_exento, 
        id_medico_defecto = @id_medico_defecto
    WHERE id = @id
  `);
  return stmt.run(data);
};

export const deleteServicio = (id) => {
  const db = getDb();
  return executeTransaction(() => {
    db.prepare('DELETE FROM servicio_insumos WHERE id_servicio = ?').run(id);
    db.prepare('DELETE FROM servicios WHERE id = ?').run(id);
  });
};

export const getAllServicios = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT s.*, m.nombre AS medico_nombre
    FROM servicios s
    LEFT JOIN medicos m ON s.id_medico_defecto = m.id
    ORDER BY s.nombre ASC
    LIMIT 100
  `);
  return stmt.all();
};

export const getServicioById = (id) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT s.*, m.nombre AS medico_nombre
    FROM servicios s
    LEFT JOIN medicos m ON s.id_medico_defecto = m.id
    WHERE s.id = ?
  `);
  return stmt.get(id);
};

export const getInsumosByServicio = (id_servicio) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT si.*, i.nombre AS insumo_nombre, i.unidad_medida
    FROM servicio_insumos si
    JOIN insumos i ON si.id_insumo = i.id
    WHERE si.id_servicio = ?
  `);
  return stmt.all(id_servicio);
};

export const setServicioInsumos = (id_servicio, insumos) => {
  return executeTransaction(() => {
    const db = getDb();
    db.prepare('DELETE FROM servicio_insumos WHERE id_servicio = ?').run(id_servicio);
    if (insumos && insumos.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO servicio_insumos (id_servicio, id_insumo, cantidad)
        VALUES (@id_servicio, @id_insumo, @cantidad)
      `);
      for (const insumo of insumos) {
        insertStmt.run({
          id_servicio,
          id_insumo: insumo.id_insumo,
          cantidad: insumo.cantidad
        });
      }
    }
  });
};
