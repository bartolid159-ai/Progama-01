
/**
 * Helpers for Medical Commissions and Liquidations (Tarea 11)
 */
export const getAllDoctors = () => {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
  }
  return getAllMedicos();
};

export const getDoctorById = (id) => {
  if (isBrowser) {
    const doctors = JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
    return doctors.find(d => d.id === (typeof id === 'string' ? parseInt(id) : id));
  }
  const db = getDb();
  return db.prepare('SELECT * FROM medicos WHERE id = ?').get(id);
};

export const getResumenComisionesPorMedico = () => {
  if (isBrowser) {
    const medicos = getAllDoctors();
    const facturas = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]');
    
    return medicos.filter(m => m.activo).map(medico => {
      const facturasMedico = facturas.filter(f => f.id_medico === medico.id);
      const totalGenerado = facturasMedico.reduce((sum, f) => {
        const amount = f.total_usd || f.totals?.total_usd || 0;
        return sum + (amount * (medico.porcentaje_comision / 100));
      }, 0);
      const totalPagado = liquidaciones
        .filter(l => l.id_medico === medico.id)
        .reduce((sum, l) => sum + l.monto_pagado_usd, 0);
      const saldoPendiente = Math.max(0, totalGenerado - totalPagado);
      
      return {
        id_medico: medico.id,
        nombre: medico.nombre,
        especialidad: medico.especialidad,
        porcentaje_comision: medico.porcentaje_comision,
        total_generado_usd: totalGenerado,
        total_pagado_usd: totalPagado,
        saldo_pendiente_usd: saldoPendiente
      };
    }).sort((a, b) => b.saldo_pendiente_usd - a.saldo_pendiente_usd);
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      m.id            AS id_medico,
      m.nombre,
      m.especialidad,
      m.porcentaje_comision,
      COALESCE(SUM(ca.haber_usd), 0)        AS total_generado_usd,
      COALESCE(
        (SELECT SUM(lm.monto_pagado_usd)
         FROM liquidaciones_medicos lm
         WHERE lm.id_medico = m.id), 0)      AS total_pagado_usd,
      COALESCE(SUM(ca.haber_usd), 0) -
      COALESCE(
        (SELECT SUM(lm.monto_pagado_usd)
         FROM liquidaciones_medicos lm
         WHERE lm.id_medico = m.id), 0)      AS saldo_pendiente_usd
    FROM medicos m
    LEFT JOIN facturas f    ON f.id_medico = m.id
    LEFT JOIN contabilidad_asientos ca
              ON ca.referencia_id = f.id
             AND ca.categoria = 'COMISION'
    WHERE m.activo = 1
    GROUP BY m.id
    ORDER BY saldo_pendiente_usd DESC
  `);
  return stmt.all();
};

export const getComisionesMedico = (idMedico, fechaDesde, fechaHasta) => {
  if (isBrowser) {
    const medico = getDoctorById(idMedico);
    if (!medico) return { medico: null, facturas: [], pagos: [], resumen: {} };
    
    const facturas = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]');
    
    let facturasMedico = facturas.filter(f => f.id_medico === idMedico);
    
    if (fechaDesde) {
      facturasMedico = facturasMedico.filter(f => new Date(f.fecha) >= new Date(fechaDesde));
    }
    if (fechaHasta) {
      facturasMedico = facturasMedico.filter(f => new Date(f.fecha) <= new Date(fechaHasta));
    }
    
    const facturasConComision = facturasMedico.map(f => {
      const amount = f.total_usd || f.totals?.total_usd || 0;
      return {
        ...f,
        total_usd: amount,
        comision_calculada: amount * (medico.porcentaje_comision / 100)
      };
    });
    
    const pagos = liquidaciones.filter(l => l.id_medico === idMedico);
    
    const totalGenerado = facturasConComision.reduce((sum, f) => sum + f.comision_calculada, 0);
    const totalPagado = pagos.reduce((sum, l) => sum + l.monto_pagado_usd, 0);
    
    return {
      medico,
      facturas: facturasConComision,
      pagos,
      resumen: {
        total_generado_usd: totalGenerado,
        total_pagado_usd: totalPagado,
        saldo_pendiente_usd: Math.max(0, totalGenerado - totalPagado)
      }
    };
  }

  const db = getDb();
  const medico = getDoctorById(idMedico);
  if (!medico) return { medico: null, facturas: [], pagos: [], resumen: {} };

  let query = `
    SELECT f.*, p.nombre AS paciente_nombre
    FROM facturas f
    LEFT JOIN pacientes p ON f.id_paciente = p.id
    WHERE f.id_medico = ?
  `;
  const params = [idMedico];

  if (fechaDesde) {
    query += \` AND f.fecha >= ?\`;
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    query += \` AND f.fecha <= ?\`;
    params.push(fechaHasta + ' 23:59:59');
  }
  query += \` ORDER BY f.fecha DESC\`;

  const facturas = db.prepare(query).all(...params);
  
  const facturasConComision = facturas.map(f => ({
    ...f,
    comision_calculada: f.total_usd * (medico.porcentaje_comision / 100)
  }));

  const pagos = db.prepare(\`
    SELECT * FROM liquidaciones_medicos
    WHERE id_medico = ?
    ORDER BY fecha_pago DESC
  \`).all(idMedico);

  const totalGenerado = facturasConComision.reduce((sum, f) => sum + f.comision_calculada, 0);
  const totalPagado = pagos.reduce((sum, l) => sum + l.monto_pagado_usd, 0);

  return {
    medico,
    facturas: facturasConComision,
    pagos,
    resumen: {
      total_generado_usd: totalGenerado,
      total_pagado_usd: totalPagado,
      saldo_pendiente_usd: Math.max(0, totalGenerado - totalPagado)
    }
  };
};

export const insertLiquidacion = (data) => {
  if (isBrowser) {
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]');
    const newId = liquidaciones.length > 0 ? Math.max(...liquidaciones.map(l => l.id)) + 1 : 1;
    const nuevaLiquidacion = {
      id: newId,
      id_medico: data.id_medico,
      fecha_pago: data.fecha_pago || new Date().toISOString().split('T')[0],
      monto_pagado_usd: data.monto_pagado_usd,
      tasa_cambio: data.tasa_cambio || 1,
      monto_pagado_ves: data.monto_pagado_ves || 0,
      metodo_pago: data.metodo_pago || 'EFECTIVO_USD',
      notas: data.notas || '',
      creado_en: new Date().toISOString()
    };
    liquidaciones.push(nuevaLiquidacion);
    localStorage.setItem('clinica_liquidaciones_db', JSON.stringify(liquidaciones));
    return { success: true, id: newId };
  }

  const db = getDb();
  const stmt = db.prepare(\`
    INSERT INTO liquidaciones_medicos (id_medico, fecha_pago, monto_pagado_usd, tasa_cambio, monto_pagado_ves, metodo_pago, notas)
    VALUES (@id_medico, @fecha_pago, @monto_pagado_usd, @tasa_cambio, @monto_pagado_ves, @metodo_pago, @notas)
  \`);
  
  const result = stmt.run({
    id_medico: data.id_medico,
    fecha_pago: data.fecha_pago || new Date().toISOString().split('T')[0],
    monto_pagado_usd: data.monto_pagado_usd,
    tasa_cambio: data.tasa_cambio || 1,
    monto_pagado_ves: data.monto_pagado_ves || 0,
    metodo_pago: data.metodo_pago || 'EFECTIVO_USD',
    notas: data.notas || ''
  });
  
  return { success: true, id: result.lastInsertRowid };
};

export const getLiquidacionesMedico = (idMedico) => {
  if (isBrowser) {
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]');
    return liquidaciones.filter(l => l.id_medico === idMedico).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
  }

  const db = getDb();
  const stmt = db.prepare(\`
    SELECT * FROM liquidaciones_medicos
    WHERE id_medico = ?
    ORDER BY fecha_pago DESC
  \`);
  return stmt.all(idMedico);
};

export const getAllLiquidaciones = () => {
  if (isBrowser) {
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]');
    const doctors = getAllDoctors();
    return liquidaciones.map(l => {
      const dr = doctors.find(d => d.id === l.id_medico);
      return {
        ...l,
        nombre_medico: dr ? dr.nombre : 'Médico Desconocido'
      };
    }).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
  }

  const db = getDb();
  const stmt = db.prepare(\`
    SELECT lm.*, m.nombre AS nombre_medico
    FROM liquidaciones_medicos lm
    JOIN medicos m ON lm.id_medico = m.id
    ORDER BY lm.fecha_pago DESC
  \`);
  return stmt.all();
};
