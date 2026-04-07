import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoiceForm from '../Billing/InvoiceForm.jsx';
import * as patientService from '../../logic/patientService';
import * as doctorService from '../../logic/doctorService';
import * as serviceLogic from '../../logic/serviceLogic';

vi.mock('../../logic/patientService');
vi.mock('../../logic/doctorService');
vi.mock('../../logic/serviceLogic');
vi.mock('../../logic/billingEngine', () => ({
  calculateTotals: vi.fn((items, rate) => ({
    subtotal_usd: items.reduce((sum, i) => sum + (i.cantidad * i.precio_usd), 0),
    iva_usd: items.reduce((sum, i) => i.es_exento ? sum : sum + (i.cantidad * i.precio_usd * 0.16), 0),
    total_usd: 0,
    total_ves: 0
  })),
  calculateCommission: vi.fn((total, pct) => total * (pct / 100)),
  getRequiredInsumos: vi.fn(() => [])
}));

describe('InvoiceForm', () => {
  const mockPatients = [
    { id: 1, nombre: 'Juan Pérez', cedula_rif: 'V12345678', telefono: '04121234567' }
  ];
  const mockDoctors = [
    { id: 1, nombre: 'Dr. House', especialidad: 'Medicina General', porcentaje_comision: 10 }
  ];
  const mockServices = [
    { id: 1, nombre: 'Consulta General', precio_usd: 30, es_exento: true },
    { id: 2, nombre: 'Electrocardiograma', precio_usd: 50, es_exento: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    patientService.searchPatients.mockResolvedValue(mockPatients);
    doctorService.getDoctors.mockResolvedValue(mockDoctors);
    serviceLogic.getServices.mockResolvedValue(mockServices);
    serviceLogic.getInsumosByServicio.mockResolvedValue([]);
  });

  it('debe renderizar el formulario de facturación', async () => {
    render(<InvoiceForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Paciente *')).toBeDefined();
      expect(screen.getByText('Médico Tratante *')).toBeDefined();
    });
  });

  it('debe buscar pacientes al escribir', async () => {
    render(<InvoiceForm />);
    
    const input = screen.getByPlaceholderText(/buscar paciente/i);
    fireEvent.change(input, { target: { value: 'Juan' } });
    
    await waitFor(() => {
      expect(patientService.searchPatients).toHaveBeenCalledWith('Juan');
    });
  });

  it('debe mostrar errores cuando no hay paciente seleccionado', async () => {
    render(<InvoiceForm />);
    
    const doctorSelect = screen.getByText('Seleccione un médico...');
    fireEvent.change(doctorSelect, { target: { value: '1' } });
    
    const processBtn = screen.getByText(/procesar factura/i);
    fireEvent.click(processBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Por favor seleccione un paciente para continuar/i)).toBeDefined();
    });
  });

  it('debe permitir agregar servicios a la factura', async () => {
    render(<InvoiceForm />);
    
    const select = await screen.findByDisplayValue(/Seleccione un servicio.../i);
    fireEvent.change(select, { target: { value: '1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Consulta General')).toBeDefined();
    });
  });
});
