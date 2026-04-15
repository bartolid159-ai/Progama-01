import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InvoiceForm from '../Billing/InvoiceForm.jsx';
import * as patientService from '../../logic/patientService';
import * as doctorService from '../../logic/doctorService';
import * as serviceLogic from '../../logic/serviceLogic';

vi.mock('../../logic/patientService');
vi.mock('../../logic/doctorService');
vi.mock('../../logic/serviceLogic');
vi.mock('../../db/manager', () => ({
  processInvoice: vi.fn(),
  getDb: vi.fn(),
  getTasaDelDia: vi.fn().mockResolvedValue(36.5)
}));
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
    { id: 1, nombre: 'Consulta General', precio_usd: 30, es_exento: true, id_medico_defecto: 1 },
    { id: 2, nombre: 'Electrocardiograma', precio_usd: 50, es_exento: false, id_medico_defecto: 1 }
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
      // El título del componente es "📋 Datos de la Factura" — regex parcial para no depender del emoji
      expect(screen.getByPlaceholderText(/Buscar por nombre/)).toBeDefined();
      expect(screen.getByText(/Datos de la Factura/i)).toBeDefined();
    });
  });

  it('debe buscar pacientes al escribir', async () => {
    render(<InvoiceForm />);

    const input = screen.getByPlaceholderText(/buscar por nombre o cédula/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Juan' } });
    });

    await waitFor(() => {
      expect(patientService.searchPatients).toHaveBeenCalledWith('Juan');
    });
  });

  it('debe mostrar errores cuando no hay paciente seleccionado', async () => {
    render(<InvoiceForm />);

    const serviceSelect = screen.getByDisplayValue(/Seleccione un servicio.../i);
    await act(async () => {
      fireEvent.change(serviceSelect, { target: { value: '1' } });
    });

    const processBtn = screen.getByText(/procesar factura/i);
    await act(async () => {
      fireEvent.click(processBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Por favor seleccione un paciente/)).toBeDefined();
    });
  });

  it('debe permitir agregar servicios a la factura', async () => {
    render(<InvoiceForm />);

    const select = await screen.findByDisplayValue(/Seleccione un servicio.../i);
    await act(async () => {
      fireEvent.change(select, { target: { value: '1' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Consulta General')).toBeDefined();
    });
  });

  it('debe mostrar campo de referencia para transferencias', async () => {
    render(<InvoiceForm />);

    const transferenciaBtn = screen.getByText(/🏦 Transferencia/i);
    await act(async () => {
      fireEvent.click(transferenciaBtn);
    });

    // El componente renderiza: "Últimos 4 dígitos de referencia *" — regex insensible a mayúsculas
    expect(screen.getByText(/últimos 4 dígitos de referencia/i)).toBeDefined();
  });

  it('debe validar que los dígitos sean 4 en pagos electrónicos', async () => {
    // Pre-cargar el draft completo: paciente, servicio, médico y método de pago
    // Así el test solo verifica la lógica de validación de los 4 dígitos
    const mockPatient = { id: 1, nombre: 'Juan Pérez', cedula_rif: 'V12345678', telefono: '04121234567' };
    const mockDoctor = { id: 1, nombre: 'Dr. House', especialidad: 'Medicina General', porcentaje_comision: 10 };
    sessionStorage.setItem('clinica_invoice_draft', JSON.stringify({
      patientSearch: 'Juan Pérez',
      selectedPatient: mockPatient,
      exchangeRateStr: '36',
      invoiceItems: [{
        id_servicio: 1,
        nombre: 'Consulta General',
        cantidad: 1,
        precio_usd: 30,
        es_exento: true,
        id_medico_defecto: 1
      }],
      derivedDoctor: mockDoctor,
      metodoPago: 'PAGO_MOVIL',
      detallePago: ''
    }));

    render(<InvoiceForm />);

    // Esperar a que se cargue el componente con el estado del draft
    await waitFor(() => {
      expect(screen.getByText('Consulta General')).toBeDefined();
    });

    // Seleccionar el método de pago explícitamente y esperar a que cambie el placeholder
    const pagoMovilBtn = screen.getByText(/📱 Pago Móvil/i);
    fireEvent.click(pagoMovilBtn);

    // El método de pago ya es PAGO_MOVIL — ingresar sólo 2 dígitos (valor inválido)
    const refInput = screen.getByPlaceholderText(/Ej: 1234/i);
    fireEvent.change(refInput, { target: { value: '12' } });

    console.log('Metodo Pago Label HTML:', screen.getByPlaceholderText(/Ej: 1234/i).outerHTML);

    // Intentar procesar: debe mostrar error de validación por dígitos insuficientes
    await act(async () => {
      fireEvent.click(screen.getByText(/procesar factura/i));
    });

    await waitFor(() => {
      // Apuntar al mensaje de error específico del <p>, no al label del campo
      expect(screen.getByText(/Debe ingresar los últimos 4 dígitos/i)).toBeDefined();
    }, { timeout: 4000 });

    // Limpiar sessionStorage tras el test
    sessionStorage.removeItem('clinica_invoice_draft');
  });
});
