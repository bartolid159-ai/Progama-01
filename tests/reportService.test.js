import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb } from '../src/db/manager';
import reportService from '../src/logic/reportService';

describe('reportService (Bimoneda)', () => {
  let db;

  beforeEach(() => {
    db = getDb(':memory:', true);
    // Reset contabilidad_asientos and insumos for each test
    db.prepare('DELETE FROM contabilidad_asientos').run();
    db.prepare('DELETE FROM insumos').run();
  });

  afterEach(() => {
    closeDb();
  });

  describe('getKpiDia', () => {
    it('debe calcular ganancia neta bimoneda correctamente', () => {
      // Insert mock asientos
      const stmt = db.prepare(`
        INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, debe_ves, haber_ves, tasa_referencia, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      const tasa = 36.5;
      stmt.run('INGRESO', 'SERVICIO', 100, 0, 3650, 0, tasa);
      stmt.run('EGRESO', 'COMISION', 0, 10, 0, 365, tasa);
      stmt.run('EGRESO', 'COSTO_INSUMO', 0, 20, 0, 730, tasa);
      
      const kpis = reportService.getKpiDia();
      
      expect(kpis.ingresos.usd).toBe(100);
      expect(kpis.egresos.usd).toBe(30);
      expect(kpis.ganancia_neta.usd).toBe(70);
      
      expect(kpis.ingresos.ves).toBe(3650);
      expect(kpis.egresos.ves).toBe(1095);
      expect(kpis.ganancia_neta.ves).toBe(2555);
    });

    it('debe retornar ceros si no hay movimientos hoy', () => {
      const kpis = reportService.getKpiDia();
      expect(kpis.ingresos.usd).toBe(0);
      expect(kpis.ganancia_neta.usd).toBe(0);
    });
  });

  describe('getStockAlertas', () => {
    it('debe identificar insumos con stock crítico incluyendo categorías', () => {
      db.prepare("INSERT INTO categorias_insumos (id, nombre) VALUES (1, 'Medico')").run();
      
      const stmt = db.prepare(`
        INSERT INTO insumos (codigo, nombre, id_categoria, stock_actual, stock_minimo)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run('G-01', 'Guantes', 1, 5, 10); // Crítico
      stmt.run('A-01', 'Alcohol', 1, 2, 2); // Crítico (igual al mínimo)
      
      const alertas = reportService.getStockAlertas();
      
      expect(alertas).toHaveLength(2);
      expect(alertas[0].categoria).toBe('Medico');
      // Order is ASC by stock_actual, so Alcohol (2) comes before Guantes (5)
      expect(alertas[0].codigo).toBe('A-01');
      expect(alertas[1].codigo).toBe('G-01');
    });
  });

  describe('getFlujoDiario', () => {
    it('debe agrupar ingresos bimoneda por día', () => {
      const insert = db.prepare(`
        INSERT INTO contabilidad_asientos (tipo, debe_usd, haber_usd, debe_ves, haber_ves, tasa_referencia, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const hoy = new Date().toISOString().split('T')[0];
      const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      insert.run('INGRESO', 100, 0, 3600, 0, 36, hoy);
      insert.run('INGRESO', 50, 0, 1800, 0, 36, ayer);
      
      const flujo = reportService.getFlujoDiario(7);
      
      expect(flujo).toHaveLength(2);
      const diaHoy = flujo.find(f => f.fecha === hoy);
      expect(diaHoy.ingresos_usd).toBe(100);
      expect(diaHoy.ingresos_ves).toBe(3600);
    });
  });
});
