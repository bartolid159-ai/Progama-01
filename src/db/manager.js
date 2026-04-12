import Database from 'better-sqlite3';
import { join } from 'path';

// Determinar si estamos en entorno Electron o Browser (LocalStorage)
const isBrowser = typeof window !== 'undefined' && !window.process;

let db;
const DB_NAME = 'clinica_local.db';

// Claves para LocalStorage (Fallback dev)
const PATIENTS_KEY = 'clinica_pacientes_db';
const DOCTORS_KEY = 'clinica_medicos_db';
const SERVICES_KEY = 'clinica_servicios_db';
const INVOICES_KEY = 'clinica_facturas_db';
const ACCOUNTS_KEY = 'clinica_contabilidad_db';

export const getDb = () => {
  if (isBrowser) return null;
  if (!db) {
    try {
      // En desarrollo, el archivo queda en la raíz del proyecto
      db = new Database(DB_NAME);
      db.pragma('foreign_keys = ON');
      console.log('📦 SQLite Conectado Core');
    } catch (error) {
      console.error('❌ Error al conectar SQLite:', error);
    }
  }
  return db;
};

export const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

/**
 * Ejecuta una transacción para asegurar integridad en operaciones múltiples.
 */
export const executeTransaction = (callback) => {
  if (isBrowser) return callback();
  const db = getDb();
  const transaction = db.transaction(callback);
  return transaction();
};

// --- MÓDULO DE PACIENTES ---

export const getAllPacientes = () => {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(PATIENTS_KEY) || '[]');
  }
  const db = getDb();
  return db.prepare('SELECT * FROM pacientes ORDER BY nombre ASC').all();
};

export const searchPatients = (query) => {
  if (isBrowser) {
    const all = getAllPacientes();
    const lowerQ = query.toLowerCase();
    return all.filter(p => 
      p.nombre.toLowerCase().includes(lowerQ) || 
      p.cedula_rif.toLowerCase().includes(lowerQ)
    );
  }
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM pacientes WHERE nombre LIKE ? OR cedula_rif LIKE ?');
  return stmt.all(`%${query}%`, `%${query}%`);
};

export const savePaciente = (paciente) => {
  if (isBrowser) {
    const patients = getAllPacientes();
    if (paciente.id) {
      const index = patients.findIndex(p => p.id === paciente.id);
      patients[index] = paciente;
    } else {
      paciente.id = Date.now();
      patients.push(paciente);
    }
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
    return { lastInsertRowid: paciente.id };
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO pacientes (cedula_rif, nombre, sexo, fecha_nacimiento, telefono, email, direccion)
    VALUES (@cedula_rif, @nombre, @sexo, @fecha_nacimiento, @telefono, @email, @direccion)
    ON CONFLICT(cedula_rif) DO UPDATE SET
      nombre=excluded.nombre,
      sexo=excluded.sexo,
      fecha_nacimiento=excluded.fecha_nacimiento,
      telefono=excluded.telefono,
      email=excluded.email,
      direccion=excluded.direccion
  `);
  return stmt.run(paciente);
};

export const deletePaciente = (id) => {
  if (isBrowser) {
    const patients = getAllPacientes().filter(p => p.id !== id);
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
    return { changes: 1 };
  }
  const db = getDb();
  return db.prepare('DELETE FROM pacientes WHERE id = ?').run(id);
};

// --- MÓDULO DE MÉDICOS ---

export const getAllMedicos = () => {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
  }
  const db = getDb();
  return db.prepare('SELECT * FROM medicos WHERE activo = 1 ORDER BY nombre ASC').all();
};

export const saveMedico = (medico) => {
  if (isBrowser) {
    const doctors = getAllMedicos();
    if (medico.id) {
      const index = doctors.findIndex(d => d.id === medico.id);
      doctors[index] = medico;
    } else {
      medico.id = Date.now();
      doctors.push(medico);
    }
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
    return { lastInsertRowid: medico.id };
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO medicos (cedula_rif, nombre, especialidad, telefono, email, porcentaje_comision)
    VALUES (@cedula_rif, @nombre, @especialidad, @telefono, @email, @porcentaje_comision)
    ON CONFLICT(cedula_rif) DO UPDATE SET
      nombre=excluded.nombre,
      especialidad=excluded.especialidad,
      telefono=excluded.telefono,
      email=excluded.email,
      porcentaje_comision=excluded.porcentaje_comision
  `);
  return stmt.run(medico);
};

export const deleteMedico = (id) => {
  if (isBrowser) {
    const doctors = getAllMedicos().filter(d => d.id !== id);
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
    return { changes: 1 };
  }
  const db = getDb();
  return db.prepare('UPDATE medicos SET activo = 0 WHERE id = ?').run(id);
};

// --- MÓDULO DE SERVICIOS ---

export const saveServicio = (servicio) => {
  if (isBrowser) {
    const services = JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]');
    if (servicio.id) {
      const index = services.findIndex(s => s.id === servicio.id);
      services[index] = servicio;
    } else {
      servicio.id = Date.now();
      services.push(servicio);
    }
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
    return { lastInsertRowid: servicio.id };
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO servicios (nombre, precio_usd, es_exento, id_medico_defecto)
    VALUES (@nombre, @precio_usd, @es_exento, @id_medico_defecto)
  `);
  
  if (servicio.id) {
    return db.prepare(`
      UPDATE servicios SET 
        nombre=@nombre, precio_usd=@precio_usd, 
        es_exento=@es_exento, id_medico_defecto=@id_medico_defecto
      WHERE id=@id
    `).run(servicio);
  }
  
  return stmt.run(servicio);
};

export const deleteServicio = (id) => {
  if (isBrowser) {
    const services = JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]').filter(s => s.id !== id);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
    return { changes: 1 };
  }
  const db = getDb();
  return db.prepare('DELETE FROM servicios WHERE id = ?').run(id);
};

export const getAllServicios = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT s.*, m.nombre AS medico_nombre
    FROM servicios s
    LEFT JOIN medicos m ON s.id_medico_defecto = m.id
    ORDER BY s.nombre ASC
    LIMIT 100
  `);
  return stmt.all();
};

export const getServicioById = (id) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT s.*, m.nombre AS medico_nombre
    FROM servicios s
    LEFT JOIN medicos m ON s.id_medico_defecto = m.id
    WHERE s.id = ?
  `);
  return stmt.get(id);
};

export const getInsumosByServicio = (id_servicio) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT si.*, i.nombre AS insumo_nombre, i.unidad_medida
    FROM servicio_insumos si
    JOIN insumos i ON si.id_insumo = i.id
    WHERE si.id_servicio = ?
  `);
  return stmt.all(id_servicio);
};

/**
 * Obtiene todas las facturas con datos del paciente (JOIN).
 * @returns {Array} Lista de facturas enriquecidas
 */


export const setServicioInsumos = (id_servicio, insumos) => {
  return executeTransaction(() => {
    const db = getDb();
    db.prepare('DELETE FROM servicio_insumos WHERE id_servicio = ?').run(id_servicio);
    if (insumos && insumos.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO servicio_insumos (id_servicio, id_insumo, cantidad)
        VALUES (@id_servicio, @id_insumo, @cantidad)
      `);
      for (const ins of insumos) {
        insertStmt.run({
          id_servicio,
          id_insumo: ins.id_insumo,
          cantidad: ins.cantidad
        });
      }
    }
  });
};

// --- MÓDULO DE FACTURACIÓN (BIMONEDA Y PARETO) ---

/**
 * Procesa una factura completa: Cabecera, Detalles, Descuento de Inventario y Asiento Contable.
 * Es una operación atómica (Transacción).
 */
export const processInvoice = async (data) => {
  return executeTransaction(() => {
    if (isBrowser) {
      // Version LocalStorage para testing UI
      const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
      const newInvoice = { 
        ...data, 
        id: invoices.length + 1, 
        fecha: new Date().toISOString() 
      };
      invoices.push(newInvoice);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

      // Simulamos asiento contable
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      accounts.push({
        id: accounts.length + 1,
        id_factura: newInvoice.id,
        tipo: 'INGRESO',
        debe_usd: data.totals.total_usd,
        fecha: newInvoice.fecha
      });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      
      return { facturaId: newInvoice.id };
    }

    const db = getDb();
    
    // 1. Insertar Cabecera de Factura
    const facturaStmt = db.prepare(`
      INSERT INTO facturas (id_paciente, id_medico, tasa_cambio, subtotal_usd, iva_usd, total_usd, total_ves, comision_medico_usd, metodo_pago, detalle_pago)
      VALUES (@id_paciente, @id_medico, @tasa_cambio, @subtotal_usd, @iva_usd, @total_usd, @total_ves, @comision_medico_usd, @metodo_pago, @detalle_pago)
    `);
    
    const infoFactura = facturaStmt.run({
      id_paciente: data.id_paciente,
      id_medico: data.id_medico,
      tasa_cambio: data.tasa_cambio,
      subtotal_usd: data.totals.subtotal_usd,
      iva_usd: data.totals.iva_usd,
      total_usd: data.totals.total_usd,
      total_ves: data.totals.total_ves,
      comision_medico_usd: data.commission,
      metodo_pago: data.metodo_pago || 'EFECTIVO_USD',
      detalle_pago: data.detalle_pago || ''
    });
    
    const facturaId = infoFactura.lastInsertRowid;

    // 2. Insertar Detalles
    const detalleStmt = db.prepare(`
      INSERT INTO factura_detalles (id_factura, id_servicio, cantidad, precio_unitario_usd, es_exento)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const item of data.items) {
      detalleStmt.run(facturaId, item.id_servicio, item.cantidad, item.precio_usd, item.es_exento ? 1 : 0);
    }

    // 3. Descontar Insumos y Registrar Consumo para Ganancia Neta
    if (data.requiredInsumos && data.requiredInsumos.length > 0) {
      const updateStockStmt = db.prepare('UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?');
      const consumoStmt = db.prepare(`
        INSERT INTO consumo_insumos (id_factura, id_insumo, cantidad_consumida, costo_unitario_usd)
        SELECT ?, id, ?, precio_costo_usd FROM insumos WHERE id = ?
      `);
      
      for (const ins of data.requiredInsumos) {
        updateStockStmt.run(ins.total_necesario, ins.id_insumo);
        consumoStmt.run(facturaId, ins.total_necesario, ins.id_insumo);
      }
    }

    // 4. Registrar Asiento Contable (Ingreso Bruto)
    const asientoStmt = db.prepare(`
      INSERT INTO contabilidad_asientos (id_factura, tipo, referencia, debe_usd)
      VALUES (?, 'INGRESO', ?, ?)
    `);
    asientoStmt.run(facturaId, `Factura #${String(facturaId).padStart(4, '0')}`, data.totals.total_usd);

    return { facturaId };
  });
};

export const getFacturaById = (id) => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    return invoices.find(inv => inv.id === id);
  }
  const db = getDb();
  return db.prepare(`
    SELECT f.*, p.nombre AS paciente_nombre, m.nombre AS medico_nombre
    FROM facturas f
    JOIN pacientes p ON f.id_paciente = p.id
    JOIN medicos m ON f.id_medico = m.id
    WHERE f.id = ?
  `).get(id);
};

export const getFacturaDetalles = (id_factura) => {
  if (isBrowser) return [];
  const db = getDb();
  return db.prepare(`
    SELECT fd.*, s.nombre AS servicio_nombre
    FROM factura_detalles fd
    JOIN servicios s ON fd.id_servicio = s.id
    WHERE fd.id_factura = ?
  `).all(id_factura);
};

export const getAllFacturas = () => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const patients = JSON.parse(localStorage.getItem(PATIENTS_KEY) || '[]');
    const doctors = JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
    
    // "Join" manual
    return invoices.map(inv => {
      const patient = patients.find(p => p.id === inv.id_paciente);
      const doctor = doctors.find(d => d.id === inv.id_medico);
      return {
        ...inv,
        paciente_nombre: patient ? patient.nombre : '—',
        paciente_cedula: patient ? patient.cedula_rif : '—',
        paciente_telefono: patient ? patient.telefono : '—',
        medico_nombre: doctor ? doctor.nombre : '—',
        total_usd: inv.totals?.total_usd || 0,
        total_ves: inv.totals?.total_ves || 0,
        metodo_pago: inv.metodo_pago || 'EFECTIVO_USD',
        detalle_pago: inv.detalle_pago || ''
      };
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  const db = getDb();
  // Unimos con pacientes y médicos para obtener nombres en el historial
  const stmt = db.prepare(`
    SELECT f.*, 
           p.nombre AS paciente_nombre, p.cedula_rif AS paciente_cedula, p.telefono AS paciente_telefono,
           m.nombre AS medico_nombre
    FROM facturas f
    LEFT JOIN pacientes p ON f.id_paciente = p.id
    LEFT JOIN medicos m ON f.id_medico = m.id
    ORDER BY f.fecha DESC
  `);
  return stmt.all();
};


export const searchFacturas = (query) => {
  if (isBrowser) {
    const all = getAllFacturas();
    if (!query) return all;
    const lowerQ = query.toLowerCase();
    return all.filter(f => 
      (f.paciente_nombre && f.paciente_nombre.toLowerCase().includes(lowerQ)) ||
      (f.paciente_cedula && f.paciente_cedula.includes(query)) ||
      (f.paciente_telefono && f.paciente_telefono.includes(query)) ||
      (f.fecha && f.fecha.includes(query))
    );
  }

  const db = getDb();
  const searchTerm = `%${query}%`;
  const stmt = db.prepare(`
    SELECT f.*, 
           p.nombre AS paciente_nombre, p.cedula_rif AS paciente_cedula, p.telefono AS paciente_telefono,
           m.nombre AS medico_nombre
    FROM facturas f
    LEFT JOIN pacientes p ON f.id_paciente = p.id
    LEFT JOIN medicos m ON f.id_medico = m.id
    WHERE p.nombre LIKE ? OR p.cedula_rif LIKE ? OR p.telefono LIKE ? OR f.fecha LIKE ?
    ORDER BY f.fecha DESC
  `);
  return stmt.all(searchTerm, searchTerm, searchTerm, searchTerm);
};


/**
 * Obtiene el monto total teórico del día desde los asientos contables.
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {number} Total USD
 */
export const getTeoricoCaja = (fecha) => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const targetDate = fecha || new Date().toISOString().split('T')[0];
    return invoices
      .filter(inv => inv.fecha.startsWith(targetDate))
      .reduce((acc, inv) => acc + (inv.totals?.total_usd || 0), 0);
  }

  const db = getDb();
  const dateStr = fecha || new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    SELECT SUM(debe_usd) AS total 
    FROM contabilidad_asientos 
    WHERE tipo = 'INGRESO' AND date(fecha) = date (?)
  `);
  const result = stmt.get(dateStr);
  return result ? (result.total || 0) : 0;
};

/**
 * Guarda el registro del cierre de caja en la base de datos.
 * @param {Object} data - Datos del cierre
 * @returns {Object} Resultado de la operación
 */
export const guardarCierreCaja = (data) => {
  if (isBrowser) {
    const cierres = JSON.parse(localStorage.getItem('clinica_cierres_db') || '[]');
    cierres.push({ ...data, id: cierres.length + 1, creado_en: new Date().toISOString() });
    localStorage.setItem('clinica_cierres_db', JSON.stringify(cierres));
    return { success: true };
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO cierres_caja (fecha, declarado_usd, teorico_usd, diferencia_usd, estado)
    VALUES (@fecha, @declarado_usd, @teorico_usd, @diferencia_usd, @estado)
  `);
  return stmt.run({
    ...data,
    fecha: data.fecha || new Date().toISOString().split('T')[0]
  });
};
