import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

vi.mock('./logic/patientService', () => ({
  searchPatients: vi.fn().mockResolvedValue([]),
  getPatients: vi.fn().mockResolvedValue([])
}));

vi.mock('./logic/doctorService', () => ({
  getDoctors: vi.fn().mockResolvedValue([])
}));

vi.mock('./logic/serviceLogic', () => ({
  getServices: vi.fn().mockResolvedValue([])
}));

vi.mock('./logic/billingEngine', () => ({
  calculateTotals: vi.fn(() => ({ subtotal_usd: 0, iva_usd: 0, total_usd: 0, total_ves: 0 })),
  calculateCommission: vi.fn(() => 0),
  getRequiredInsumos: vi.fn(() => [])
}));

describe('App - Billing Integration', () => {
  it('debe mostrar la vista de facturación al hacer clic en Facturación', () => {
    render(<App />);
    
    const billingLink = screen.getByText('Facturación');
    fireEvent.click(billingLink);
    
    expect(screen.getByText('Paciente *')).toBeDefined();
    expect(screen.getByText('Médico Tratante *')).toBeDefined();
  });

  it('debe cambiar el título al navegar a facturación', () => {
    render(<App />);
    
    const billingLink = screen.getByText('Facturación');
    fireEvent.click(billingLink);
    
    const headers = screen.getAllByText('Facturación');
    expect(headers.length).toBe(2);
  });
});
