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
const INSUMOS_KEY = 'clinica_insumos_db';



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
  if (isBrowser) return { 
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
    const schemaPath = pth.join(process.cwd(), 'src/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      dbInstance.exec(schemaSql);
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
 * CRUD helpers for 'insumos'.
 */
export const insertInsumo = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO insumos (nombre, stock_actual, stock_minimo, unidad_medida, costo_unitario_usd)
    VALUES (@nombre, @stock_actual, @stock_minimo, @unidad_medida, @costo_unitario_usd)
  `);
  return stmt.run(data);
};

export const getAllInsumos = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM insumos ORDER BY nombre ASC LIMIT 100');
  return stmt.all();
};

export const getInsumoById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM insumos WHERE id = ?');
  return stmt.get(id);
};

export const updateInsumo = (data) => {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE insumos 
    SET nombre = @nombre, 
        stock_actual = @stock_actual, 
        stock_minimo = @stock_minimo, 
        unidad_medida = @unidad_medida, 
        costo_unitario_usd = @costo_unitario_usd
    WHERE id = @id
  `);
  return stmt.run(data);
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
 * Process a complete invoice with ACID transaction.
 * 1. INSERT into facturas
 * 2. INSERT into factura_detalles (per item)
 * 3. UPDATE stock in insumos (deduct materials)
 * 4. INSERT into asientos_contables (Income + Commission)
 */
export const processInvoice = (invoiceData) => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const facturaId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
    
    const newInvoice = {
      ...invoiceData,
      id: facturaId,
      fecha: new Date().toISOString(),
      estatus: 'PAGADA'
    };
    
    invoices.push(newInvoice);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    
    // Simular descuento de stock
    if (invoiceData.requiredInsumos && invoiceData.requiredInsumos.length > 0) {
      const insumos = JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
      invoiceData.requiredInsumos.forEach(req => {
        const insumo = insumos.find(i => i.id === req.id_insumo);
        if (insumo) {
          insumo.stock_actual -= req.cantidad_total;
        }
      });
      localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
    }
    
    return { success: true, facturaId, message: 'Factura procesada (Modo Navegador)' };
  }

  return executeTransaction(() => {
    const db = getDb();
    const { id_paciente, id_medico, tasa_cambio, items, totals, commission, requiredInsumos } = invoiceData;

    const round2 = (num) => Math.round(num * 100) / 100;

    const insertFactura = db.prepare(`
      INSERT INTO facturas (id_paciente, id_medico, tasa_cambio, total_usd, total_ves, estatus)
      VALUES (@id_paciente, @id_medico, @tasa_cambio, @total_usd, @total_ves, 'PAGADA')
    `);

    const facturaResult = insertFactura.run({
      id_paciente,
      id_medico,
      tasa_cambio,
      total_usd: round2(totals.total_usd),
      total_ves: round2(totals.total_ves)
    });

    const facturaId = facturaResult.lastInsertRowid;

    const insertDetalle = db.prepare(`
      INSERT INTO factura_detalles (id_factura, id_servicio, cantidad, precio_unitario_usd, iva_porcentaje)
      VALUES (@id_factura, @id_servicio, @cantidad, @precio_unitario_usd, @iva_porcentaje)
    `);

    for (const item of items) {
      const ivaPorcentaje = item.es_exento ? 0 : 16;
      insertDetalle.run({
        id_factura: facturaId,
        id_servicio: item.id_servicio,
        cantidad: item.cantidad,
        precio_unitario_usd: round2(item.precio_usd),
        iva_porcentaje: ivaPorcentaje
      });
    }

    if (requiredInsumos && requiredInsumos.length > 0) {
      const updateStock = db.prepare(`
        UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?
      `);
      for (const insumo of requiredInsumos) {
        updateStock.run(insumo.cantidad_total, insumo.id_insumo);
      }
    }

    const insertAsiento = db.prepare(`
      INSERT INTO asientos_contables (tipo, categoria, monto_usd, descripcion, id_referencia)
      VALUES (@tipo, @categoria, @monto_usd, @descripcion, @id_referencia)
    `);

    insertAsiento.run({
      tipo: 'INGRESO',
      categoria: 'SERVICIO',
      monto_usd: round2(totals.subtotal_usd),
      descripcion: `Factura #${facturaId} - Ingreso por servicios`,
      id_referencia: facturaId
    });

    if (commission > 0) {
      insertAsiento.run({
        tipo: 'EGRESO',
        categoria: 'COMISION',
        monto_usd: round2(commission),
        descripcion: `Factura #${facturaId} - Comisión médica`,
        id_referencia: facturaId
      });
    }

    return { success: true, facturaId, message: 'Factura procesada exitosamente' };
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
        total_ves: inv.totals?.total_ves || 0
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


