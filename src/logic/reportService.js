import { getDb } from '../db/manager';

const round2 = (num) => Math.round(num * 100) / 100;

/**
 * Obtiene KPIs financieros del día actual (Bimoneda)
 */
export const getKpiDia = () => {
  const db = getDb();
  const hoy = new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT 
      SUM(debe_usd) as ingresos_usd,
      SUM(haber_usd) as egresos_usd,
      SUM(debe_ves) as ingresos_ves,
      SUM(haber_ves) as egresos_ves
    FROM contabilidad_asientos
    WHERE DATE(fecha) = ?
  `;
  
  const result = db.prepare(query).get(hoy) || { ingresos_usd: 0, egresos_usd: 0, ingresos_ves: 0, egresos_ves: 0 };
  
  return {
    ingresos: { usd: round2(result.ingresos_usd || 0), ves: round2(result.ingresos_ves || 0) },
    egresos: { usd: round2(result.egresos_usd || 0), ves: round2(result.egresos_ves || 0) },
    ganancia_neta: { 
      usd: round2((result.ingresos_usd || 0) - (result.egresos_usd || 0)),
      ves: round2((result.ingresos_ves || 0) - (result.egresos_ves || 0))
    }
  };
};

/**
 * Obtiene los servicios más rentables (Pareto Real: Ingreso - Costos)
 */
export const getTopServicios = (limite = 5) => {
  const db = getDb();
  const query = `
    SELECT 
      s.nombre,
      SUM(fd.cantidad * fd.precio_unitario_usd) as total_ingreso_usd,
      (
        SELECT SUM(haber_usd) 
        FROM contabilidad_asientos a
        JOIN facturas f ON a.referencia_id = f.id
        WHERE f.id IN (SELECT id_factura FROM factura_detalles WHERE id_servicio = s.id)
        AND a.categoria IN ('COMISION', 'COSTO_INSUMO')
      ) as total_egreso_usd
    FROM factura_detalles fd
    JOIN servicios s ON fd.id_servicio = s.id
    GROUP BY s.id
    ORDER BY (total_ingreso_usd - IFNULL(total_egreso_usd, 0)) DESC
    LIMIT ?
  `;
  const results = db.prepare(query).all(limite);
  return results.map(r => ({
    nombre: r.nombre,
    ingresos_usd: round2(r.total_ingreso_usd),
    ganancia_neta_usd: round2(r.total_ingreso_usd - (r.total_egreso_usd || 0))
  }));
};

/**
 * Alertas de Stock (Crítico <= Mínimo)
 */
export const getStockAlertas = () => {
  const db = getDb();
  const query = `
    SELECT i.id, i.codigo, i.nombre, i.stock_actual, i.stock_minimo, c.nombre as categoria
    FROM insumos i
    LEFT JOIN categorias_insumos c ON i.id_categoria = c.id
    WHERE i.stock_actual <= i.stock_minimo
    ORDER BY i.stock_actual ASC
  `;
  return db.prepare(query).all();
};

/**
 * Obtiene historial de tasas de cambio
 */
export const getAuditoriaTasas = (limite = 15) => {
  const db = getDb();
  return db.prepare('SELECT * FROM historial_tasas ORDER BY fecha DESC LIMIT ?').all(limite);
};

/**
 * Flujo de Caja (Bimoneda)
 */
export const getFlujoDiario = (diasAtras = 7) => {
  const db = getDb();
  const query = `
    SELECT 
      DATE(fecha) as fecha,
      SUM(debe_usd) as ingresos_usd,
      SUM(haber_usd) as egresos_usd,
      SUM(debe_ves) as ingresos_ves,
      SUM(haber_ves) as egresos_ves
    FROM contabilidad_asientos
    WHERE fecha >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(fecha)
    ORDER BY fecha ASC
  `;
  return db.prepare(query).all(diasAtras).map(r => ({
    ...r,
    ingresos_usd: round2(r.ingresos_usd),
    egresos_usd: round2(r.egresos_usd),
    ganancia_neta_usd: round2(r.ingresos_usd - r.egresos_usd)
  }));
};


/**
 * Calcula la diferencia entre lo declarado y lo teórico y retorna el estado del semáforo.
 * @param {number} declarado - Monto declarado por el cajero (USD)
 * @param {number} teorico - Monto teórico registrado en el sistema (USD)
 * @returns {Object} { diferencia, estado }
 */
export const calcularDiferenciaCaja = (declarado, teorico) => {
  const diferencia = round2(declarado - teorico);
  let estado = 'OK';
  
  if (Math.abs(diferencia) > 5) {
    estado = 'FALTANTE';
  } else if (Math.abs(diferencia) > 0) {
    estado = 'ALERTA';
  }
  
  return { diferencia, estado };
};

export default {
  getKpiDia,
  getTopServicios,
  getStockAlertas,
  getFlujoDiario,
  getAuditoriaTasas,
  calcularDiferenciaCaja
};
