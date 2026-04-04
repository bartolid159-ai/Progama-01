import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, insertMedico, updateMedico, deactivateMedico, getAllMedicos } from '../../src/db/manager.js';
import fs from 'fs';
import path from 'path';

const TEST_DB = 'test_data.sqlite';

describe('Doctor DB Integration (Real SQLite)', () => {
  let db;

  beforeAll(() => {
    // Ensure clean start
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    db = getDb(TEST_DB, true);
  });

  afterAll(() => {
    if (db) db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  const sampleDoctor = {
    nombre: 'Integration Test Doctor',
    cedula_rif: 'V-TEST',
    telefono: '0412-TEST',
    correo: 'test@example.com',
    especialidad: 'Testing',
    porcentaje_comision: 10
  };

  it('should insert a doctor and retrieve it', () => {
    const result = insertMedico(sampleDoctor);
    expect(result.lastInsertRowid).toBeDefined();

    const doctors = getAllMedicos();
    const found = doctors.find(d => d.nombre === sampleDoctor.nombre);
    expect(found).toBeDefined();
    expect(found.cedula_rif).toBe(sampleDoctor.cedula_rif);
  });

  it('should update an existing doctor', () => {
    const doctors = getAllMedicos();
    const doctor = doctors.find(d => d.nombre === sampleDoctor.nombre);
    
    const updatedData = {
      ...doctor,
      nombre: 'Updated Name',
      porcentaje_comision: 20
    };

    updateMedico(updatedData);

    const refreshed = getAllMedicos();
    const found = refreshed.find(d => d.id === doctor.id);
    expect(found.nombre).toBe('Updated Name');
    expect(found.porcentaje_comision).toBe(20);
  });

  it('should soft-delete (deactivate) a doctor', () => {
    const doctors = getAllMedicos();
    const doctor = doctors.find(d => d.nombre === 'Updated Name');
    
    deactivateMedico(doctor.id);

    const refreshed = getAllMedicos();
    const found = refreshed.find(d => d.id === doctor.id);
    // getAllMedicos filters by activo = 1
    expect(found).toBeUndefined();
  });
});
