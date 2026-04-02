import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as patientService from '../../src/logic/patientService';
import * as dbManager from '../../src/db/manager';

// Mock the db manager
vi.mock('../../src/db/manager', () => ({
  getPacienteByCedula: vi.fn(),
  insertPaciente: vi.fn(),
  searchPatients: vi.fn(),
  getAllPatients: vi.fn(),
  getDb: vi.fn()
}));

describe('PatientService Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate required fields correctly', async () => {
    const incompleteData = { nombre: 'Test' };
    const result = await patientService.registerPatient(incompleteData);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('obligatorio');
  });

  it('should reject duplicate cedula_rif', async () => {
    const validData = {
      cedula_rif: 'V-123',
      nombre: 'Test User',
      sexo: 'M',
      fecha_nacimiento: '1990-01-01'
    };

    // Simulate existing patient
    dbManager.getPacienteByCedula.mockReturnValue({ id: 1, ...validData });

    const result = await patientService.registerPatient(validData);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('ya se encuentra registrada');
  });

  it('should register a new patient successfully when data is valid and unique', async () => {
    const validData = {
      cedula_rif: 'V-456',
      nombre: 'New User',
      sexo: 'F',
      fecha_nacimiento: '1995-05-05'
    };

    dbManager.getPacienteByCedula.mockReturnValue(null);
    dbManager.insertPaciente.mockReturnValue({ lastInsertRowid: 10 });

    const result = await patientService.registerPatient(validData);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('exitosamente');
    expect(result.id).toBe(10);
  });
});
