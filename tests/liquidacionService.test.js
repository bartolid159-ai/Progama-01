import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as liquidacionService from '../src/logic/liquidacionService';
import * as manager from '../src/db/manager';

// Mock del manager
vi.mock('../src/db/manager', () => ({
  getResumenComisionesPorMedico: vi.fn(),
  getComisionesMedico: vi.fn(),
  insertLiquidacion: vi.fn(),
  getLiquidacionesMedico: vi.fn(),
  getAllLiquidaciones: vi.fn()
}));

describe('LiquidacionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registrarPago', () => {
    it('debería rechazar pagos con monto <= 0', async () => {
      const result = await liquidacionService.registrarPago({ id_medico: 1, monto_pagado_usd: 0 });
      expect(result.success).toBe(false);
      expect(result.message).toContain('mayor a 0');
    });

    it('debería rechazar pagos que superen el saldo pendiente', async () => {
      // Setup: Médico tiene $50 de saldo
      manager.getComisionesMedico.mockReturnValue({
        resumen: { saldo_pendiente_usd: 50 }
      });

      const result = await liquidacionService.registrarPago({ 
        id_medico: 1, 
        monto_pagado_usd: 100 
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('supera el saldo pendiente');
    });

    it('debería procesar pagos válidos correctamente', async () => {
      manager.getComisionesMedico.mockReturnValue({
        resumen: { saldo_pendiente_usd: 100 }
      });
      manager.insertLiquidacion.mockReturnValue({ success: true, id: 123 });

      const pagoData = {
        id_medico: 1,
        monto_pagado_usd: 50,
        tasa_cambio: 36,
        metodo_pago: 'PAGO_MOVIL'
      };

      const result = await liquidacionService.registrarPago(pagoData);

      expect(result.success).toBe(true);
      expect(manager.insertLiquidacion).toHaveBeenCalledWith(expect.objectContaining({
        id_medico: 1,
        monto_pagado_usd: 50,
        monto_pagado_ves: 1800 // 50 * 36
      }));
    });
  });

  describe('Cálculos de Integridad', () => {
    it('debería obtener el resumen global sin errores', async () => {
      manager.getResumenComisionesPorMedico.mockReturnValue([
        { id_medico: 1, nombre: 'Dr. House', saldo_pendiente_usd: 100 }
      ]);

      const data = await liquidacionService.getResumenLiquidaciones();
      expect(data).toHaveLength(1);
      expect(data[0].nombre).toBe('Dr. House');
    });
  });
});
