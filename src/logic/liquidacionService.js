import { getResumenComisionesPorMedico, getComisionesMedico, insertLiquidacion, getLiquidacionesMedico, getAllLiquidaciones } from '../db/manager';

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const getResumenLiquidaciones = async () => {
  return getResumenComisionesPorMedico();
};

export const getDetalleLiquidacion = async (idMedico, fechaDesde, fechaHasta) => {
  return getComisionesMedico(idMedico, fechaDesde, fechaHasta);
};

export const getHistorialGlobalLiquidaciones = async () => {
  return getAllLiquidaciones();
};

export const registrarPago = async (pagoData) => {
  if (!pagoData || !pagoData.id_medico) {
    return { success: false, message: 'ID de médico requerido' };
  }

  if (!pagoData.monto_pagado_usd || pagoData.monto_pagado_usd <= 0) {
    return { success: false, message: 'El monto a pagar debe ser mayor a 0' };
  }

  const detalle = getComisionesMedico(pagoData.id_medico, null, null);
  const saldoPendiente = detalle.resumen.saldo_pendiente_usd || 0;

  if (pagoData.monto_pagado_usd > saldoPendiente) {
    return { 
      success: false, 
      message: `El monto ($${pagoData.monto_pagado_usd}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)})` 
    };
  }

  const tasaCambio = pagoData.tasa_cambio || 1;
  const montoPagadoVes = tasaCambio > 0 ? pagoData.monto_pagado_usd * tasaCambio : 0;

  const result = insertLiquidacion({
    id_medico: pagoData.id_medico,
    fecha_pago: pagoData.fecha_pago || new Date().toISOString().split('T')[0],
    monto_pagado_usd: pagoData.monto_pagado_usd,
    tasa_cambio: tasaCambio,
    monto_pagado_ves: montoPagadoVes,
    metodo_pago: pagoData.metodo_pago || 'EFECTIVO_USD',
    notas: pagoData.notas || ''
  });

  return result;
};

export const getHistorialPagos = async (idMedico) => {
  return getLiquidacionesMedico(idMedico);
};
