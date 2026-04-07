/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serviceService from '../../src/logic/serviceLogic';
import * as dbManager from '../../src/db/manager.js';

vi.mock('../../src/db/manager.js', () => ({
  insertServicio: vi.fn(),
  updateServicio: vi.fn(),
  deleteServicio: vi.fn(),
  getAllServicios: vi.fn(),
  getServicioById: vi.fn(),
  getInsumosByServicio: vi.fn(),
  setServicioInsumos: vi.fn(),
  insertInsumo: vi.fn(),
  getAllInsumos: vi.fn()
}));

// Ensure we refer to mock mocks
const mockedDb = dbManager;

describe('ServiceLogic - Backend Node Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validService = {
    nombre: 'Consulta Cardiológica',
    precio_usd: 45,
    es_exento: false,
    id_medico_defecto: 1
  };

  const validInsumos = [
    { id_insumo: 1, cantidad: 2 },
    { id_insumo: 2, cantidad: 1 }
  ];

  describe('registerService', () => {
    it('should register a service with insumos successfully', async () => {
      vi.mocked(mockedDb.insertServicio).mockReturnValue({ lastInsertRowid: 1 });
      
      const result = await serviceService.registerService({
        ...validService,
        insumos: validInsumos
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(mockedDb.insertServicio).toHaveBeenCalled();
      expect(mockedDb.setServicioInsumos).toHaveBeenCalledWith(1, validInsumos);
    });

    it('should return error if nombre is missing', async () => {
      const result = await serviceService.registerService({
        precio_usd: 45,
        es_exento: false
      });

      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toContain('nombre');
    });

    it('should return error if precio_usd is negative', async () => {
      const result = await serviceService.registerService({
        nombre: 'Test Service',
        precio_usd: -10,
        es_exento: true
      });

      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toContain('precio');
    });

    it('should register service without insumos', async () => {
      vi.mocked(mockedDb.insertServicio).mockReturnValue({ lastInsertRowid: 2 });

      const result = await serviceService.registerService(validService);

      expect(result.success).toBe(true);
      expect(mockedDb.setServicioInsumos).not.toHaveBeenCalled();
    });
  });

  describe('updateService', () => {
    it('should update service and recalculate insumos', async () => {
      vi.mocked(mockedDb.updateServicio).mockReturnValue({ changes: 1 });

      const result = await serviceService.updateService({
        id: 1,
        ...validService,
        insumos: validInsumos
      });

      expect(result.success).toBe(true);
      expect(mockedDb.updateServicio).toHaveBeenCalled();
      expect(mockedDb.setServicioInsumos).toHaveBeenCalledWith(1, validInsumos);
    });

    it('should return error if id is missing', async () => {
      const result = await serviceService.updateService(validService);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ID');
    });
  });

  describe('deleteService', () => {
    it('should delete service and its relations', async () => {
      const result = await serviceService.deleteService(1);

      expect(result.success).toBe(true);
      expect(mockedDb.deleteServicio).toHaveBeenCalledWith(1);
    });
  });

  describe('getServices', () => {
    it('should return all services with insumos', async () => {
      const mockServicios = [
        { id: 1, nombre: 'Consulta General', precio_usd: 30, es_exento: true }
      ];
      const mockInsumosItems = [{ id_insumo: 1, cantidad: 2 }];
      
      vi.mocked(mockedDb.getAllServicios).mockReturnValue(mockServicios);
      vi.mocked(mockedDb.getInsumosByServicio).mockReturnValue(mockInsumosItems);

      const results = await serviceService.getServices();

      expect(results).toHaveLength(1);
      expect(results[0].insumos).toEqual(mockInsumosItems);
    });
  });

  describe('getInsumos', () => {
    it('should return catalog of available insumos', async () => {
      const mockInsumosList = [
        { id: 1, nombre: 'Guantes de Látex', unidad_medida: 'Par', stock_actual: 200 },
        { id: 2, nombre: 'Jeringa 5ml', unidad_medida: 'Unidad', stock_actual: 150 }
      ];
      
      vi.mocked(mockedDb.getAllInsumos).mockReturnValue(mockInsumosList);

      const results = await serviceService.getInsumos();

      expect(results).toHaveLength(2);
      expect(mockedDb.getAllInsumos).toHaveBeenCalled();
    });
  });
});
