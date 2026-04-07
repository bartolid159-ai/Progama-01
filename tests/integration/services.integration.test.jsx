import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

vi.mock('../../src/logic/serviceLogic', () => ({
  getServices: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Consulta General', precio_usd: 30, es_exento: true, insumos: [] },
    { id: 2, nombre: 'Electrocardiograma', precio_usd: 50, es_exento: false, insumos: [{ id_insumo: 1, cantidad: 1 }] }
  ]),
  getInsumos: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Guantes de Látex', unidad_medida: 'Par' },
    { id: 2, nombre: 'Jeringa 5ml', unidad_medida: 'Unidad' }
  ]),
  registerService: vi.fn().mockResolvedValue({ success: true, message: 'Servicio registrado', id: 3 }),
  updateService: vi.fn().mockResolvedValue({ success: true, message: 'Servicio actualizado' }),
  deleteService: vi.fn().mockResolvedValue({ success: true, message: 'Servicio eliminado' })
}));

vi.mock('../../src/logic/doctorService', () => ({
  getDoctors: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Dr. Gregory House', especialidad: 'Diagnóstico' },
    { id: 2, nombre: 'Dra. Allison Cameron', especialidad: 'Inmunología' }
  ])
}));

describe('Services Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render Services page without errors', async () => {
    render(<App />);
    
    const servicesNavItem = screen.getByText('Servicios');
    await userEvent.click(servicesNavItem);
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
    });
  });

  it('should display services list with correct data', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    
    await waitFor(() => {
      expect(screen.getByText('Consulta General')).toBeInTheDocument();
      expect(screen.getByText('Electrocardiograma')).toBeInTheDocument();
    });
  });

  it('should open service form when clicking Nuevo Servicio button', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    
    const addButton = screen.getByRole('button', { name: /nuevo servicio/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Registrar Nuevo Servicio')).toBeInTheDocument();
    });
  });

  it('should display IVA badges correctly (Exento/IVA 16%)', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    
    await waitFor(() => {
      expect(screen.getAllByText('Exento')).toHaveLength(1);
      expect(screen.getAllByText('IVA 16%')).toHaveLength(1);
    });
  });

  it('should load doctors in form dropdown', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    await userEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Registrar Nuevo Servicio')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Dr. Gregory House' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Dra. Allison Cameron' })).toBeInTheDocument();
    });
  });

  it('should toggle IVA exemption checkbox', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    await userEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Exento de IVA')).toBeInTheDocument();
    });
    
    const checkbox = screen.getByRole('checkbox', { name: /exento/i });
    expect(checkbox).toBeChecked();
    
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('should cancel form and return to list', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    await userEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Registrar Nuevo Servicio')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Registrar Nuevo Servicio')).not.toBeInTheDocument();
      expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
    });
  });

  it('should show price badges with correct formatting', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    
    await waitFor(() => {
      expect(screen.getByText('$30.00')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });
  });

  it('should show insumos count in services list', async () => {
    render(<App />);
    
    await userEvent.click(screen.getByText('Servicios'));
    
    await waitFor(() => {
      expect(screen.getByText('Sin insumos')).toBeInTheDocument();
      expect(screen.getByText('1 insumo')).toBeInTheDocument();
    });
  });
});
