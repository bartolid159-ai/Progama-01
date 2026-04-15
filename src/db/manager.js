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
    UPDATE insumos SET 
      codigo = @codigo, nombre = @nombre, descripcion = @descripcion, 
      id_categoria = @id_categoria, stock_actual = @stock_actual, 
      stock_minimo = @stock_minimo, unidad_medida = @unidad_medida, 
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

    // 4. Asientos Bimoneda
    const insertAsiento = db.prepare(`
      INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, debe_ves, haber_ves, tasa_referencia, descripcion, referencia_id)
      VALUES (@tipo, @categoria, @debe_usd, @haber_usd, @debe_ves, @haber_ves, @tasa_referencia, @descripcion, @referencia_id)
    `);

    // INGRESO por servicios
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

    // 3. Stock y Lotes FIFO
    if (requiredInsumos && requiredInsumos.length > 0) {
      const updateStock = db.prepare('UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?');
      const getLotes = db.prepare('SELECT id, cantidad_actual, costo_unitario_usd FROM insumo_lotes WHERE id_insumo = ? AND cantidad_actual > 0 ORDER BY fecha_ingreso ASC, id ASC');
      const updateLote = db.prepare('UPDATE insumo_lotes SET cantidad_actual = ? WHERE id = ?');

      for (const req of requiredInsumos) {
        updateStock.run(req.cantidad_total, req.id_insumo);
        
        let cant_requerida = req.cantidad_total;
        let costo_este_insumo = 0;
        
        const lotes = getLotes.all(req.id_insumo);
        for (const lote of lotes) {
          if (cant_requerida <= 0) break;
          const a_descontar = Math.min(lote.cantidad_actual, cant_requerida);
          updateLote.run(lote.cantidad_actual - a_descontar, lote.id);
          cant_requerida -= a_descontar;
          costo_este_insumo += (a_descontar * lote.costo_unitario_usd);
        }
        
        // Fallback for remaining amount without lot data
        if (cant_requerida > 0) {
           const insumo = db.prepare('SELECT costo_unitario_usd FROM insumos WHERE id = ?').get(req.id_insumo);
           if (insumo) {
              costo_este_insumo += (cant_requerida * insumo.costo_unitario_usd);
           }
        }

        if (costo_este_insumo > 0) {
          const costoUsd = round2(costo_este_insumo);
          insertAsiento.run({
            tipo: 'EGRESO',
            categoria: 'COSTO_INSUMO',
            debe_usd: 0,
            haber_usd: costoUsd,
            debe_ves: 0,
            haber_ves: round2(costoUsd * tasa_cambio),
            tasa_referencia: tasa_cambio,
            descripcion: `Factura #${facturaId} - Costo insumo ID ${req.id_insumo} (FIFO)`,
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

export const registrarCompra = (compraData) => {
  return executeTransaction(() => {
    const db = getDb();
    const { proveedor, observaciones, items } = compraData;
    
    const totalUsd = items.reduce((sum, item) => sum + (item.cantidad * item.costo_unitario_usd), 0);
    
    const compraId = db.prepare(`
      INSERT INTO compras (proveedor, total_usd, observaciones)
      VALUES (@proveedor, @total_usd, @observaciones)
    `).run({
      proveedor: proveedor || '',
      total_usd: Math.round(totalUsd * 100) / 100,
      observaciones: observaciones || ''
    }).lastInsertRowid;

    const updateInsumo = db.prepare(`
      UPDATE insumos 
      SET stock_actual = stock_actual + @cantidad,
          costo_unitario_usd = @costo_unitario_usd
      WHERE id = @id_insumo
    `);
    
    const insertDetalle = db.prepare(`
      INSERT INTO compra_detalles (id_compra, id_insumo, cantidad, costo_unitario_usd)
      VALUES (@id_compra, @id_insumo, @cantidad, @costo_unitario_usd)
    `);

    const insertLote = db.prepare(`
      INSERT INTO insumo_lotes (id_insumo, id_compra, cantidad_inicial, cantidad_actual, costo_unitario_usd)
      VALUES (@id_insumo, @id_compra, @cantidad, @cantidad, @costo_unitario_usd)
    `);

    for (const item of items) {
      insertDetalle.run({
        id_compra: compraId,
        id_insumo: item.id_insumo,
        cantidad: item.cantidad,
        costo_unitario_usd: Math.round(item.costo_unitario_usd * 100) / 100
      });
      
      insertLote.run({
        id_insumo: item.id_insumo,
        id_compra: compraId,
        cantidad: item.cantidad,
        costo_unitario_usd: Math.round(item.costo_unitario_usd * 100) / 100
      });

      updateInsumo.run({
        id_insumo: item.id_insumo,
        cantidad: item.cantidad,
        costo_unitario_usd: Math.round(item.costo_unitario_usd * 100) / 100
      });
    }

    return { success: true, compraId, message: 'Compra y lote registrados correctamente' };
  });
};

export const getAllCompras = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM compra_detalles WHERE id_compra = c.id) AS num_items
    FROM compras c
    ORDER BY c.fecha DESC
    LIMIT 100
  `);
  return stmt.all();
};

export const getCompraById = (id) => {
  const db = getDb();
  const compra = db.prepare('SELECT * FROM compras WHERE id = ?').get(id);
  if (!compra) return null;
  
  const detalles = db.prepare(`
    SELECT cd.*, i.nombre AS insumo_nombre, i.codigo AS insumo_codigo
    FROM compra_detalles cd
    JOIN insumos i ON cd.id_insumo = i.id
    WHERE cd.id_compra = ?
  `).all(id);
  
  return { ...compra, detalles };
};

export const validarStockInsumos = (requiredInsumos) => {
  if (!requiredInsumos || requiredInsumos.length === 0) {
    return { valido: true, faltantes: [] };
  }

  const db = getDb();
  const faltantes = [];

  for (const req of requiredInsumos) {
    const insumo = db.prepare('SELECT id, nombre, stock_actual FROM insumos WHERE id = ?').get(req.id_insumo);
    if (!insumo) {
      faltantes.push({ id_insumo: req.id_insumo, nombre: `ID ${req.id_insumo}`, requerido: req.cantidad_total, disponible: 0 });
    } else if (insumo.stock_actual < req.cantidad_total) {
      faltantes.push({ id_insumo: req.id_insumo, nombre: insumo.nombre, requerido: req.cantidad_total, disponible: insumo.stock_actual });
    }
  }

  return { valido: faltantes.length === 0, faltantes };
};

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
    query += ` AND f.fecha >= ?`;
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    query += ` AND f.fecha <= ?`;
    params.push(fechaHasta + ' 23:59:59');
  }
  query += ` ORDER BY f.fecha DESC`;

  const facturas = db.prepare(query).all(...params);
  
  const facturasConComision = facturas.map(f => ({
    ...f,
    comision_calculada: f.total_usd * (medico.porcentaje_comision / 100)
  }));

  const pagos = db.prepare(`
    SELECT * FROM liquidaciones_medicos
    WHERE id_medico = ?
    ORDER BY fecha_pago DESC
  `).all(idMedico);

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
  const stmt = db.prepare(`
    INSERT INTO liquidaciones_medicos (id_medico, fecha_pago, monto_pagado_usd, tasa_cambio, monto_pagado_ves, metodo_pago, notas)
    VALUES (@id_medico, @fecha_pago, @monto_pagado_usd, @tasa_cambio, @monto_pagado_ves, @metodo_pago, @notas)
  `);
  
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
  const stmt = db.prepare(`
    SELECT * FROM liquidaciones_medicos
    WHERE id_medico = ?
    ORDER BY fecha_pago DESC
  `);
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
  const stmt = db.prepare(`
    SELECT lm.*, m.nombre AS nombre_medico
    FROM liquidaciones_medicos lm
    JOIN medicos m ON lm.id_medico = m.id
    ORDER BY lm.fecha_pago DESC
  `);
  return stmt.all();
};
