import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServiceList from '../../src/components/Services/ServiceList';
import ServiceForm from '../../src/components/Services/ServiceForm';
import * as serviceLogic from '../../src/logic/serviceLogic';

// Mock the logic
vi.mock('../../src/logic/serviceLogic', () => ({
  getServices: vi.fn(),
  getInsumos: vi.fn(),
  registerService: vi.fn(),
  deleteService: vi.fn(),
  updateService: vi.fn()
}));

// Mock doctor service too
vi.mock('../../src/logic/doctorService', () => ({
  getDoctors: vi.fn(() => Promise.resolve([{ id: 1, nombre: 'Dr. Test' }]))
}));

describe('Services UI - Functional Button Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ServiceList should show "Cargando" and then display data', async () => {
    serviceLogic.getServices.mockResolvedValue([
      { id: 1, nombre: 'Consulta Test', precio_usd: 100, es_exento: true, insumos: [] }
    ]);

    render(<ServiceList onAddClick={() => {}} onEditClick={() => {}} />);

    expect(screen.getByText(/Cargando/i)).toBeDefined();
    
    await waitFor(() => {
      expect(screen.getByText('Consulta Test')).toBeDefined();
    });
  });

  it('ServiceList should call deleteService when clicking trash icon', async () => {
    serviceLogic.getServices.mockResolvedValue([
      { id: 1, nombre: 'Eliminar Me', precio_usd: 10, es_exento: true, insumos: [] }
    ]);
    serviceLogic.deleteService.mockResolvedValue({ success: true });
    
    render(<ServiceList onAddClick={() => {}} onEditClick={() => {}} />);

    await waitFor(() => screen.getByText('Eliminar Me'));
    
    const deleteBtn = screen.getByTitle('Eliminar');
    fireEvent.click(deleteBtn);

    // Esperar a que el modal de confirmación aparezca y confirmar
    const confirmBtn = await screen.findByText('Confirmar');
    fireEvent.click(confirmBtn);

    expect(serviceLogic.deleteService).toHaveBeenCalledWith(1);
  });

  it('ServiceForm should call registerService with correct data', async () => {
    serviceLogic.getInsumos.mockResolvedValue([]);
    serviceLogic.registerService.mockResolvedValue({ success: true, message: 'OK' });
    const onSave = vi.fn();

    render(<ServiceForm onSave={onSave} onCancel={() => {}} />);

    // Fill the form
    const nombreInput = screen.getByPlaceholderText(/Ej. Consulta/i);
    const precioInput = screen.getByPlaceholderText('0.00');
    
    fireEvent.change(nombreInput, { target: { value: 'Nueva Consulta', name: 'nombre' } });
    fireEvent.change(precioInput, { target: { value: '55.5', name: 'precio_usd' } });

    const submitBtn = screen.getByText('Guardar Servicio');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(serviceLogic.registerService).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nueva Consulta',
          precio_usd: 55.5,
          insumos: expect.any(Array)
        })
      );
      expect(onSave).toHaveBeenCalledWith('OK');
    });
  });
});
