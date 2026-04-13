const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

let Database = null;
let path = null;
let fs = null;
let fileURLToPath = null;

if (!isBrowser) {
  // We use dynamic imports to prevent Vite from bundling these in the browser
  // The 'await' here requires the functions using these variables to be async 
  // or for us to use a custom initialization.
  // For the purpose of this ERP, we'll keep it simple:
}

// Browser persistence keys
const INVOICES_KEY = 'clinica_facturas_db';
const PATIENTS_KEY = 'clinica_patients_db';
const DOCTORS_KEY = 'clinica_doctors_db';
const INSUMOS_KEY = 'clinica_insumos';



let dbInstance = null;


/**
 * Ensures a single database instance is used (Singleton pattern).
 * Sets up Pragmas for performance and ACID compliance.
 * Reads logic from schema.sql.
 * 
 * @param {string} dbPath - File path to sqlite db or ':memory:'
 * @param {boolean} loadSchema - Whether to load schema on init
 * @returns {Database} The initialized better-sqlite3 database instance
 */
export function getDb(dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : 'data.sqlite', loadSchema = true) {
  if (isBrowser && process.env.NODE_ENV !== 'test') return { 
    prepare: () => ({ run: () => ({ lastInsertRowid: 1 }), get: () => null, all: () => [], transaction: (cb) => cb }),
    exec: () => {},
    pragma: () => {},
    transaction: (cb) => cb
  };
  
  if (dbInstance) return dbInstance;
  
  const isMemory = dbPath === ':memory:' || dbPath.startsWith(':memory:');

  let Database, fs, pth;
  try {
    // Escapar del bundler para evitar errores en navegador
    const req = typeof require !== 'undefined' ? require : (typeof process !== 'undefined' && process.mainModule ? process.mainModule.require : eval('require'));
    Database = req('better-sqlite3');
    fs = req('fs');
    pth = req('path');
  } catch (err) {
    console.warn("Could not load native SQLite bindings. Running with stub database.");
    return {
      prepare: () => ({ run: () => ({ lastInsertRowid: 1 }), get: () => null, all: () => [], transaction: (cb) => cb }),
      exec: () => {},
      pragma: () => {},
      transaction: (cb) => cb
    };
  }

  // Ensure the directory exists if it's a file path
  if (!isMemory) {
    const dir = pth.dirname(dbPath);
    if (dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Initialize DB
  dbInstance = new Database(dbPath);

  // Pragmas for performance and enforcing foreign keys (ACID bounds)
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('synchronous = NORMAL');
  dbInstance.pragma('foreign_keys = ON');

  // Conditionally load the initial schema if it exists 
  if (loadSchema) {
    // Definimos la ruta relativa al archivo manager.js o al CWD
    // En Vitest/Node, process.cwd() suele ser la raíz del proyecto
    const schemaPath = pth.join(process.cwd(), 'src', 'db', 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        dbInstance.exec(schemaSql);
      } catch (err) {
        console.error("Error cargando el esquema SQL:", err);
      }
    } else {
      console.warn(`Schema file not found at ${schemaPath}. Ensure you are running from project root.`);
    }
  }
  
  return dbInstance;
}


/**
 * Cleanly closes the existing connection if any.
 */
export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * General purpose transaction helper to wrap complex logic in an ACID transaction.
 * @param {Function} callback - Function that executes SQL commands
 * @returns {*} Result of the callback
 */
export function executeTransaction(callback) {
  if (isBrowser) return callback();
  if (!dbInstance) {
    throw new Error("Database is not initialized. Call getDb() first.");
  }
  const transaction = dbInstance.transaction(callback);
  return transaction();
}

/**
 * Basic CRUD helpers for 'pacientes' to satisfy Task 02 criteria.
 */
export const insertPaciente = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO pacientes (cedula_rif, nombre, sexo, fecha_nacimiento, telefono, correo, direccion)
    VALUES (@cedula_rif, @nombre, @sexo, @fecha_nacimiento, @telefono, @correo, @direccion)
  `);
  return stmt.run(data);
};

export const getPacienteByCedula = (cedula_rif) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM pacientes WHERE cedula_rif = ?');
  return stmt.get(cedula_rif);
};

export const searchPatients = (query) => {
  const db = getDb();
  if (!query) return getAllPatients();
  const target = `%${query}%`;
  const stmt = db.prepare('SELECT * FROM pacientes WHERE nombre LIKE ? OR cedula_rif LIKE ? LIMIT 50');
  return stmt.all(target, target);
};

export const getAllPatients = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM pacientes ORDER BY created_at DESC LIMIT 100');
  return stmt.all();
};

/**
 * Basic CRUD helpers for 'medicos'.
 */
export const insertMedico = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO medicos (nombre, cedula_rif, telefono, correo, especialidad, porcentaje_comision, activo)
    VALUES (@nombre, @cedula_rif, @telefono, @correo, @especialidad, @porcentaje_comision, 1)
  `);
  return stmt.run(data);
};

export const updateMedico = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE medicos 
    SET nombre = @nombre, 
        cedula_rif = @cedula_rif, 
        telefono = @telefono, 
        correo = @correo, 
        especialidad = @especialidad, 
        porcentaje_comision = @porcentaje_comision
    WHERE id = @id
  `);
  return stmt.run(data);
};

export const deactivateMedico = (id) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE medicos SET activo = 0 WHERE id = ?');
  return stmt.run(id);
};

export const searchMedicos = (query) => {
  const db = getDb();
  if (!query) return getAllMedicos();
  const target = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM medicos 
    WHERE activo = 1 
    AND (nombre LIKE ? OR cedula_rif LIKE ? OR especialidad LIKE ?) 
    LIMIT 50
  `);
  return stmt.all(target, target, target);
};

export const getAllMedicos = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM medicos WHERE activo = 1 ORDER BY nombre ASC LIMIT 100');
  return stmt.all();
};

/**
 * CRUD helpers for 'insumos' (Updated for PRD v2).
 */
export const insertInsumo = (data) => {
  if (data.stock_actual < 0 || data.costo_unitario_usd < 0 || data.stock_minimo < 0) {
    throw new Error('Valores de stock y costo no pueden ser negativos');
  }
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO insumos (codigo, nombre, descripcion, id_categoria, stock_actual, stock_minimo, unidad_medida, costo_unitario_usd)
    VALUES (@codigo, @nombre, @descripcion, @id_categoria, @stock_actual, @stock_minimo, @unidad_medida, @costo_unitario_usd)
  `);
  return stmt.run(data);
};

export const updateInsumo = (data) => {
  if (data.stock_actual < 0 || data.costo_unitario_usd < 0 || data.stock_minimo < 0) {
    throw new Error('Valores de stock y costo no pueden ser negativos');
  }
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE insumos 
    SET codigo = @codigo,
        nombre = @nombre, 
        descripcion = @descripcion,
        id_categoria = @id_categoria,
        stock_actual = @stock_actual, 
        stock_minimo = @stock_minimo, 
        unidad_medida = @unidad_medida, 
        costo_unitario_usd = @costo_unitario_usd
    WHERE id = @id
  `);
  return stmt.run(data);
};

export const getAllInsumos = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT i.*, c.nombre AS categoria_nombre
    FROM insumos i
    LEFT JOIN categorias_insumos c ON i.id_categoria = c.id
    ORDER BY i.nombre ASC 
    LIMIT 100
  `);
  return stmt.all();
};

export const getInsumoById = (id) => {
  const db = getDb();
  return db.prepare('SELECT * FROM insumos WHERE id = ?').get(id);
};

export const deleteInsumo = (id) => {
  const db = getDb();
  return db.prepare('DELETE FROM insumos WHERE id = ?').run(id);
};

export const searchInsumos = (query, idCategoria = null) => {
  const db = getDb();
  if (!query && !idCategoria) return getAllInsumos();
  
  const target = query ? `%${query}%` : '%';
  let sql = `
    SELECT i.*, c.nombre AS categoria_nombre
    FROM insumos i
    LEFT JOIN categorias_insumos c ON i.id_categoria = c.id
    WHERE (i.nombre LIKE ? OR i.codigo LIKE ?)
  `;
  const params = [target, target];
  
  if (idCategoria) {
    sql += ' AND i.id_categoria = ?';
    params.push(idCategoria);
  }
  
  sql += ' ORDER BY i.nombre ASC LIMIT 100';
  return db.prepare(sql).all(...params);
};

export const getInsumosByCategoria = (idCategoria) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT i.*, c.nombre AS categoria_nombre
    FROM insumos i
    LEFT JOIN categorias_insumos c ON i.id_categoria = c.id
    WHERE i.id_categoria = ?
    ORDER BY i.nombre ASC
  `);
  return stmt.all(idCategoria);
};

export const getInsumosConStockBajo = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT i.*, c.nombre AS categoria_nombre
    FROM insumos i
    LEFT JOIN categorias_insumos c ON i.id_categoria = c.id
    WHERE i.stock_actual <= i.stock_minimo
    ORDER BY i.stock_actual ASC
  `);
  return stmt.all();
};

export const deleteCategoria = (id) => {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM categorias_insumos WHERE id = ?');
  return stmt.run(id);
};

export const updateCategoria = (data) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE categorias_insumos SET nombre = @nombre WHERE id = @id');
  return stmt.run(data);
};

/**
 * Categorías de Insumos
 */
export const insertCategoria = (nombre) => {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO categorias_insumos (nombre) VALUES (?)');
  return stmt.run(nombre);
};

export const getAllCategorias = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM categorias_insumos ORDER BY nombre ASC').all();
};

/**
 * CRUD helpers for 'servicios' with transaction-safe relation management.
 */
export const insertServicio = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO servicios (nombre, precio_usd, es_exento, id_medico_defecto)
    VALUES (@nombre, @precio_usd, @es_exento, @id_medico_defecto)
  `);
  return stmt.run(data);
};

export const updateServicio = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE servicios 
    SET nombre = @nombre, 
        precio_usd = @precio_usd, 
        es_exento = @es_exento, 
        id_medico_defecto = @id_medico_defecto
    WHERE id = @id
  `);
  return stmt.run(data);
};

export const deleteServicio = (id) => {
  const db = getDb();
  return executeTransaction(() => {
    db.prepare('DELETE FROM servicio_insumos WHERE id_servicio = ?').run(id);
    db.prepare('DELETE FROM servicios WHERE id = ?').run(id);
  });
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
      for (const insumo of insumos) {
        insertStmt.run({
          id_servicio,
          id_insumo: insumo.id_insumo,
          cantidad: insumo.cantidad
        });
      }
    }
  });
};

/**
 * Tasa de Cambio (PRD v2)
 */
export const registrarTasa = (fecha, valor) => {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO historial_tasas (fecha, valor_bcv) VALUES (?, ?)');
  return stmt.run(fecha, valor);
};

export const getTasaDelDia = () => {
  const db = getDb();
  const hoy = new Date().toISOString().split('T')[0];
  const stmt = db.prepare('SELECT valor_bcv FROM historial_tasas WHERE fecha = ?');
  let result = stmt.get(hoy);
  
  if (!result) {
    // Fallback: última tasa registrada
    result = db.prepare('SELECT valor_bcv FROM historial_tasas ORDER BY fecha DESC LIMIT 1').get();
  }
  
  return result ? result.valor_bcv : 1; // Default to 1 if no rates found
};
/**
 * Process a complete invoice with ACID transaction (Updated for PRD v2 Bimoneda).
 */
export const processInvoice = (invoiceData) => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const facturaId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
    const newInvoice = { 
      ...invoiceData, 
      id: facturaId, 
      fecha: new Date().toISOString(), 
      estatus: 'PAGADA',
      metodo_pago: invoiceData.metodo_pago || 'EFECTIVO_USD',
      detalle_pago: invoiceData.detalle_pago || ''
    };
    invoices.push(newInvoice);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    
    // Descontar stock de insumos en localStorage
    const { requiredInsumos } = invoiceData;
    if (requiredInsumos && requiredInsumos.length > 0) {
      const insumos = JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
      for (const req of requiredInsumos) {
        const insumoIndex = insumos.findIndex(i => i.id === req.id_insumo);
        if (insumoIndex !== -1) {
          insumos[insumoIndex].stock_actual = Math.max(0, (insumos[insumoIndex].stock_actual || 0) - req.cantidad_total);
        }
      }
      localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
    }
    
    return { success: true, facturaId, message: 'Factura procesada (Navegador)' };
  }

  return executeTransaction(() => {
    const db = getDb();
    const { id_paciente, id_medico, tasa_cambio, items, totals, commission, requiredInsumos } = invoiceData;
    const round2 = (num) => Math.round(num * 100) / 100;

    // 1. Factura
    const facturaId = db.prepare(`
      INSERT INTO facturas (id_paciente, id_medico, tasa_cambio, total_usd, total_ves, estatus, metodo_pago, detalle_pago)
      VALUES (@id_paciente, @id_medico, @tasa_cambio, @total_usd, @total_ves, 'PAGADA', @metodo_pago, @detalle_pago)
    `).run({
      id_paciente, id_medico, tasa_cambio,
      total_usd: round2(totals.total_usd),
      total_ves: round2(totals.total_ves),
      metodo_pago: invoiceData.metodo_pago || 'EFECTIVO_USD',
      detalle_pago: invoiceData.detalle_pago || ''
    }).lastInsertRowid;

    // 2. Detalles
    const insertDetalle = db.prepare(`
      INSERT INTO factura_detalles (id_factura, id_servicio, cantidad, precio_unitario_usd, iva_porcentaje)
      VALUES (@id_factura, @id_servicio, @cantidad, @precio_unitario_usd, @iva_porcentaje)
    `);
    for (const item of items) {
      insertDetalle.run({
        id_factura: facturaId, id_servicio: item.id_servicio,
        cantidad: item.cantidad, precio_unitario_usd: round2(item.precio_usd),
        iva_porcentaje: item.es_exento ? 0 : 16
      });
    }

    // 3. Stock
    if (requiredInsumos && requiredInsumos.length > 0) {
      const updateStock = db.prepare('UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?');
      for (const insumo of requiredInsumos) {
        updateStock.run(insumo.cantidad_total, insumo.id_insumo);
      }
    }

    // 4. Asientos Bimoneda
    const insertAsiento = db.prepare(`
      INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, debe_ves, haber_ves, tasa_referencia, descripcion, referencia_id)
      VALUES (@tipo, @categoria, @debe_usd, @haber_usd, @debe_ves, @haber_ves, @tasa_referencia, @descripcion, @referencia_id)
    `);

    // INGRESO por servicios (Cobra en DB: Debe vs Haber)
    // Usualmente: Debe Banco (monto) vs Haber Ingreso (monto)
    // Para simplificar segun PRD: Ingreso Total
    insertAsiento.run({
      tipo: 'INGRESO',
      categoria: 'SERVICIO',
      debe_usd: round2(totals.subtotal_usd),
      haber_usd: 0,
      debe_ves: round2(totals.subtotal_usd * tasa_cambio),
      haber_ves: 0,
      tasa_referencia: tasa_cambio,
      descripcion: `Factura #${facturaId} - Ingreso por servicios`,
      referencia_id: facturaId
    });

    if (commission > 0) {
      insertAsiento.run({
        tipo: 'EGRESO',
        categoria: 'COMISION',
        debe_usd: 0,
        haber_usd: round2(commission),
        debe_ves: 0,
        haber_ves: round2(commission * tasa_cambio),
        tasa_referencia: tasa_cambio,
        descripcion: `Factura #${facturaId} - Comisión médica`,
        referencia_id: facturaId
      });
    }

    if (requiredInsumos && requiredInsumos.length > 0) {
      for (const req of requiredInsumos) {
        const insumo = db.prepare('SELECT costo_unitario_usd FROM insumos WHERE id = ?').get(req.id_insumo);
        if (insumo && insumo.costo_unitario_usd > 0) {
          const costoUsd = round2(insumo.costo_unitario_usd * req.cantidad_total);
          insertAsiento.run({
            tipo: 'EGRESO',
            categoria: 'COSTO_INSUMO',
            debe_usd: 0,
            haber_usd: costoUsd,
            debe_ves: 0,
            haber_ves: round2(costoUsd * tasa_cambio),
            tasa_referencia: tasa_cambio,
            descripcion: `Factura #${facturaId} - Costo insumo ID ${req.id_insumo}`,
            referencia_id: facturaId
          });
        }
      }
    }

    return { success: true, facturaId, message: 'Factura procesada (Bimoneda)' };
  });
};


export const getFacturaById = (id) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT f.*, p.nombre AS paciente_nombre, m.nombre AS medico_nombre
    FROM facturas f
    LEFT JOIN pacientes p ON f.id_paciente = p.id
    LEFT JOIN medicos m ON f.id_medico = m.id
    WHERE f.id = ?
  `);
  return stmt.get(id);
};

export const getFacturaDetalles = (id_factura) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT fd.*, s.nombre AS servicio_nombre
    FROM factura_detalles fd
    JOIN servicios s ON fd.id_servicio = s.id
    WHERE fd.id_factura = ?
  `);
  return stmt.all(id_factura);
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
