import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as doctorService from '../../src/logic/doctorService';
import * as dbManager from '../../src/db/manager';

// Mock the db manager
vi.mock('../../src/db/manager', () => ({
  insertMedico: vi.fn(),
  updateMedico: vi.fn(),
  deactivateMedico: vi.fn(),
  searchMedicos: vi.fn(),
  getAllMedicos: vi.fn(),
  getDbManager: vi.fn()
}));

// Mock process to simulate Node environment (not browser)
vi.stubGlobal('window', undefined);

describe('DoctorService Logic & Action Buttons Backend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validDoctor = {
    nombre: 'Dr. Gregory House',
    cedula_rif: 'V-12345',
    especialidad: 'Diagnóstico',
    porcentaje_comision: 30,
    telefono: '0412-5551234',
    correo: 'house@princeton.com'
  };

  it('should register a new doctor with all fields successfully', async () => {
    dbManager.insertMedico.mockReturnValue({ lastInsertRowid: 101 });

    const result = await doctorService.registerDoctor(validDoctor);
    
    expect(result.success).toBe(true);
    expect(result.id).toBe(101);
    expect(dbManager.insertMedico).toHaveBeenCalledWith(validDoctor);
  });

  it('should validate required fields (nombre, especialidad, comision)', async () => {
    const incomplete = { nombre: 'Dr. Solo Nombre' };
    const result = await doctorService.registerDoctor(incomplete);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('obligatorio');
  });

  it('should update doctor details successfully', async () => {
    const updateData = { id: 101, ...validDoctor, especialidad: 'Nefrología' };
    dbManager.updateMedico.mockReturnValue({ changes: 1 });

    const result = await doctorService.updateDoctor(updateData);
    
    expect(result.success).toBe(true);
    expect(dbManager.updateMedico).toHaveBeenCalledWith(updateData);
  });

  it('should verify soft-delete functionality (deactivate)', async () => {
    const doctorId = 101;
    dbManager.deactivateMedico.mockReturnValue({ changes: 1 });

    const result = await doctorService.deleteDoctor(doctorId);
    
    expect(result.success).toBe(true);
    expect(dbManager.deactivateMedico).toHaveBeenCalledWith(doctorId);
  });

  it('should search doctors correctly', async () => {
    const query = 'House';
    dbManager.searchMedicos.mockReturnValue([validDoctor]);

    const results = await doctorService.searchDoctors(query);
    
    expect(results).toHaveLength(1);
    expect(results[0].nombre).toContain('House');
    expect(dbManager.searchMedicos).toHaveBeenCalledWith(query);
  });
});
