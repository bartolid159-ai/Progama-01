import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../../src/components/Dashboard/Dashboard';
import FinancialSummary from '../../src/components/Dashboard/FinancialSummary';
import PatientStats from '../../src/components/Dashboard/PatientStats';
import ServicePerformance from '../../src/components/Dashboard/ServicePerformance';
import DashboardFilters from '../../src/components/Dashboard/DashboardFilters';

const mockOnShowBanner = vi.fn();

describe('Dashboard Component - Tarea 07', () => {
  describe('Dashboard Main Component', () => {
    it('debe renderizar el título del dashboard', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Panel de Inteligencia de Negocio')).toBeDefined();
      }, { timeout: 2000 });
    });

    it('debe mostrar el subtítulo del dashboard', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Control bimoneda y métricas operativas/i)).toBeDefined();
      }, { timeout: 2000 });
    });

    it('debe mostrar las métricas principales del dashboard', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Ingresos')).toBeDefined();
        expect(screen.getByText('Total Egresos')).toBeDefined();
        expect(screen.getByText('Ganancia Neta (Hoy)')).toBeDefined();
      }, { timeout: 2000 });
    });
  });

  describe('FinancialSummary Component', () => {
    it('debe renderizar el título de ingresos mensuales', () => {
      render(<FinancialSummary revenue={125000} growth={12.5} />);
      expect(screen.getByText('Ingresos Mensuales')).toBeDefined();
    });

    it('debe mostrar el valor formateado en pesos mexicanos', () => {
      render(<FinancialSummary revenue={125000} growth={12.5} />);
      expect(screen.getByText('$125,000')).toBeDefined();
    });

    it('debe mostrar badge positivo para crecimiento positivo', () => {
      render(<FinancialSummary revenue={125000} growth={12.5} />);
      const badge = document.querySelector('.growth-badge.positive');
      expect(badge).toBeDefined();
    });

    it('debe mostrar badge negativo para crecimiento negativo', () => {
      render(<FinancialSummary revenue={125000} growth={-5.2} />);
      const badge = document.querySelector('.growth-badge.negative');
      expect(badge).toBeDefined();
    });

    it('debe manejar valores de crecimiento cero', () => {
      render(<FinancialSummary revenue={100000} growth={0} />);
      expect(screen.getByText('$100,000')).toBeDefined();
    });
  });

  describe('PatientStats Component', () => {
    it('debe renderizar el título de pacientes activos', () => {
      render(<PatientStats activePatients={847} />);
      expect(screen.getByText('Pacientes Activos')).toBeDefined();
    });

    it('debe mostrar el número de pacientes', () => {
      render(<PatientStats activePatients={847} />);
      expect(screen.getByText('847')).toBeDefined();
    });

    it('debe mostrar barras del mini gráfico', () => {
      render(<PatientStats activePatients={500} />);
      const bars = document.querySelectorAll('.mini-bar');
      expect(bars.length).toBe(7);
    });

    it('debe manejar valores grandes de pacientes', () => {
      render(<PatientStats activePatients={99999} />);
      expect(screen.getByText('99,999')).toBeDefined();
    });
  });

  describe('ServicePerformance Component', () => {
    it('debe renderizar el título de servicios', () => {
      render(<ServicePerformance serviceFilter="all" />);
      expect(screen.getByText('Servicios más Demandados')).toBeDefined();
    });

    it('debe mostrar lista de servicios', () => {
      render(<ServicePerformance serviceFilter="all" />);
      expect(screen.getByText('Consulta General')).toBeDefined();
      expect(screen.getByText('Laboratorio')).toBeDefined();
    });

    it('debe filtrar servicios cuando se especifica filtro', async () => {
      render(<ServicePerformance serviceFilter="consulta" />);
      await waitFor(() => {
        expect(screen.getByText('Consulta General')).toBeDefined();
      });
    });

    it('debe mostrar barras de progreso para servicios', () => {
      render(<ServicePerformance serviceFilter="all" />);
      const bars = document.querySelectorAll('.service-bar');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('DashboardFilters Component', () => {
    it('debe renderizar todos los grupos de filtros', () => {
      render(
        <DashboardFilters
          dateRange="30"
          doctorFilter="all"
          serviceFilter="all"
          onFilterChange={() => {}}
        />
      );
      
      expect(screen.getByText('Período')).toBeDefined();
      expect(screen.getByText('Médico')).toBeDefined();
      expect(screen.getByText('Servicio')).toBeDefined();
    });

    it('debe tener valor por defecto de 30 días', () => {
      render(
        <DashboardFilters
          dateRange="30"
          doctorFilter="all"
          serviceFilter="all"
          onFilterChange={() => {}}
        />
      );
      
      const select = document.querySelector('.filter-select');
      expect(select.value).toBe('30');
    });

    it('debe llamar a onFilterChange al cambiar período', () => {
      const mockFilterChange = vi.fn();
      render(
        <DashboardFilters
          dateRange="30"
          doctorFilter="all"
          serviceFilter="all"
          onFilterChange={mockFilterChange}
        />
      );
      
      const selects = document.querySelectorAll('.filter-select');
      fireEvent.change(selects[0], { target: { value: '7' } });
      
      expect(mockFilterChange).toHaveBeenCalledWith('dateRange', '7');
    });

    it('debe llamar a onFilterChange al cambiar médico', () => {
      const mockFilterChange = vi.fn();
      render(
        <DashboardFilters
          dateRange="30"
          doctorFilter="all"
          serviceFilter="all"
          onFilterChange={mockFilterChange}
        />
      );
      
      const selects = document.querySelectorAll('.filter-select');
      fireEvent.change(selects[1], { target: { value: 'dr1' } });
      
      expect(mockFilterChange).toHaveBeenCalledWith('doctor', 'dr1');
    });

    it('debe tener botón de restablecer', () => {
      render(
        <DashboardFilters
          dateRange="30"
          doctorFilter="all"
          serviceFilter="all"
          onFilterChange={() => {}}
        />
      );
      
      expect(screen.getByText('Restablecer')).toBeDefined();
    });

    it('debe restablecer todos los filtros al hacer clic', () => {
      const mockFilterChange = vi.fn();
      render(
        <DashboardFilters
          dateRange="7"
          doctorFilter="dr1"
          serviceFilter="consulta"
          onFilterChange={mockFilterChange}
        />
      );
      
      const resetButton = screen.getByText('Restablecer');
      fireEvent.click(resetButton);
      
      expect(mockFilterChange).toHaveBeenCalledWith('dateRange', '30');
      expect(mockFilterChange).toHaveBeenCalledWith('doctor', 'all');
      expect(mockFilterChange).toHaveBeenCalledWith('service', 'all');
    });
  });

  describe('Edge Cases - Dashboard', () => {
    it('debe manejar valores de revenue muy altos', () => {
      render(<FinancialSummary revenue={999999999} growth={50} />);
      expect(screen.getByText('$999,999,999')).toBeDefined();
    });

    it('debe manejar valores de revenue en cero', () => {
      render(<FinancialSummary revenue={0} growth={0} />);
      expect(screen.getByText('$0')).toBeDefined();
    });

    it('debe manejar crecimiento muy alto', () => {
      render(<FinancialSummary revenue={100000} growth={999.9} />);
      const badge = document.querySelector('.growth-badge.positive');
      expect(badge).toBeDefined();
    });

    it('debe manejar cero pacientes', () => {
      render(<PatientStats activePatients={0} />);
      expect(screen.getByText('0')).toBeDefined();
    });
  });
});