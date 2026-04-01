import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb, insertPaciente, getPacienteByCedula, executeTransaction } from '../../src/db/manager.js';

describe('Database Manager ACID and Schema Tests', () => {
  beforeEach(() => {
    // Initializing in-memory test DB
    getDb(':memory:');
  });

  afterEach(() => {
    // Close DB after tests
    closeDb();
  });

  it('should initialize the database and load schema correctly', () => {
    const db = getDb(':memory:');
    
    // Check if some core tables exist
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('pacientes');
    expect(tableNames).toContain('configuracion');
    expect(tableNames).toContain('facturas');
  });

  it('should allow successful insertion and retrieval of test entities', () => {
    const pacienteData = {
      cedula_rif: 'V-12345678',
      nombre: 'Jesus Sanchez',
      sexo: 'M',
      fecha_nacimiento: '1990-01-01',
      telefono: '04141234567',
      correo: 'jesus@example.com',
      direccion: 'Caracas, Venezuela'
    };

    // Insert
    const result = insertPaciente(pacienteData);
    expect(result.changes).toBe(1);

    // Retrieve
    const paciente = getPacienteByCedula('V-12345678');
    expect(paciente).toBeDefined();
    expect(paciente.nombre).toBe('Jesus Sanchez');
    expect(paciente.cedula_rif).toBe('V-12345678');
  });

  it('should support ACID transactions', () => {
    const db = getDb(':memory:');
    
    try {
      executeTransaction(() => {
        db.prepare(`INSERT INTO pacientes (cedula_rif, nombre) VALUES ('V-111', 'Transaccion 1')`).run();
        // Force error to trigger rollback
        db.prepare(`INSERT INTO pacientes (cedula_rif, nombre) VALUES ('V-111', 'Transaccion 2')`).run(); 
      });
    } catch (e) {
      // Expected UNIQUE constraint failed
    }

    // Verify rolling back happened
    const paciente = db.prepare('SELECT * FROM pacientes WHERE cedula_rif = ?').get('V-111');
    expect(paciente).toBeUndefined();
  });
});
