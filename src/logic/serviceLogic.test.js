import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as serviceLogic from './serviceLogic';

// Mock localStorage for browser tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; })
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('serviceLogic', () => {
  beforeEach(() => {
    localStorageMock.clear();
    serviceLogic.setBrowserMode(true);
  });

  it('debe registrar un servicio exitosamente en modo navegador', async () => {
    const serviceData = { nombre: 'Consulta Test', precio_usd: 100, es_exento: true };
    const insumos = [{ id_insumo: 1, cantidad: 5 }];
    
    const result = await serviceLogic.registerService(serviceData, insumos);
    
    expect(result.success).toBe(true);
    const services = await serviceLogic.getServices();
    expect(services).toHaveLength(3); // 2 iniciales + 1 nuevo
    expect(services[2].nombre).toBe('Consulta Test');
    expect(services[2].insumos).toHaveLength(1);
    expect(services[2].insumos[0].cantidad).toBe(5);
  });

  it('debe validar campos obligatorios', async () => {
    const result = await serviceLogic.registerService({ precio_usd: 100 });
    expect(result.success).toBe(false);
    expect(result.message).toContain('Nombre');
  });

  it('debe eliminar un servicio', async () => {
    const servicesBefore = await serviceLogic.getServices();
    const idToDelete = servicesBefore[0].id;
    
    const result = await serviceLogic.deleteService(idToDelete);
    expect(result.success).toBe(true);
    
    const servicesAfter = await serviceLogic.getServices();
    expect(servicesAfter).toHaveLength(servicesBefore.length - 1);
  });

  it('debe traer la lista de insumos iniciales', async () => {
    const insumos = await serviceLogic.getInsumos();
    expect(insumos).toHaveLength(3);
    expect(insumos[0].nombre).toBe('Guantes de Látex');
  });

  it('debe actualizar un servicio y sus insumos', async () => {
    const services = await serviceLogic.getServices();
    const service = services[0];
    const newInsumos = [{ id_insumo: 3, cantidad: 10 }];
    
    const result = await serviceLogic.updateService({ ...service, nombre: 'Editado' }, newInsumos);
    expect(result.success).toBe(true);
    
    const updatedServices = await serviceLogic.getServices();
    const updated = updatedServices.find(s => s.id === service.id);
    expect(updated.nombre).toBe('Editado');
    expect(updated.insumos).toHaveLength(1);
    expect(updated.insumos[0].id_insumo).toBe(3);
  });
});
