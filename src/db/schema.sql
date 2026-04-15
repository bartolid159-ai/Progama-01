-- Configuracion Global
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cedula_rif TEXT UNIQUE,
  nombre TEXT,
  sexo TEXT,
  fecha_nacimiento DATE,
  telefono TEXT,
  correo TEXT,
  direccion TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Médicos
CREATE TABLE IF NOT EXISTS medicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT_NOT_NULL,
  cedula_rif TEXT,
  telefono TEXT,
  correo TEXT,
  especialidad TEXT,
  porcentaje_comision REAL,
  activo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categorías de Insumos
CREATE TABLE IF NOT EXISTS categorias_insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);

-- Inventario de Insumos (Actualizado PRD v2)
CREATE TABLE IF NOT EXISTS insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE,
  nombre TEXT,
  descripcion TEXT,
  id_categoria INTEGER,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  unidad_medida TEXT,
  costo_unitario_usd REAL DEFAULT 0.0,
  FOREIGN KEY(id_categoria) REFERENCES categorias_insumos(id)
);

-- Catálogo de Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  precio_usd REAL,
  es_exento BOOLEAN DEFAULT 1,
  id_medico_defecto INTEGER,
  FOREIGN KEY(id_medico_defecto) REFERENCES medicos(id)
);

-- Intersección Servicios <-> Insumos (Receta autom.)
CREATE TABLE IF NOT EXISTS servicio_insumos (
  id_servicio INTEGER,
  id_insumo INTEGER,
  cantidad INTEGER,
  PRIMARY KEY (id_servicio, id_insumo),
  FOREIGN KEY(id_servicio) REFERENCES servicios(id),
  FOREIGN KEY(id_insumo) REFERENCES insumos(id)
);

-- Facturas
CREATE TABLE IF NOT EXISTS facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_paciente INTEGER,
  id_medico INTEGER,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  tasa_cambio REAL,
  total_usd REAL,
  total_ves REAL,
  estatus TEXT DEFAULT 'PAGADA',
  metodo_pago TEXT DEFAULT 'EFECTIVO_USD',
  detalle_pago TEXT,
  FOREIGN KEY(id_paciente) REFERENCES pacientes(id),
  FOREIGN KEY(id_medico) REFERENCES medicos(id)
);

-- Detalles de Factura
CREATE TABLE IF NOT EXISTS factura_detalles (
  id_factura INTEGER,
  id_servicio INTEGER,
  cantidad INTEGER,
  precio_unitario_usd REAL,
  iva_porcentaje REAL DEFAULT 0.0,
  FOREIGN KEY(id_factura) REFERENCES facturas(id),
  FOREIGN KEY(id_servicio) REFERENCES servicios(id)
);

-- Historial de Tasas (PRD v2)
CREATE TABLE IF NOT EXISTS historial_tasas (
  fecha DATE PRIMARY KEY,
  valor_bcv DECIMAL NOT NULL
);

-- Contabilidad y Flujo Bimoneda (PRD v2)
CREATE TABLE IF NOT EXISTS contabilidad_asientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  tasa_referencia DECIMAL,
  referencia_id INTEGER,
  tipo TEXT, -- INGRESO, EGRESO
  categoria TEXT, -- SERVICIO, COSTO_INSUMO, COMISION, GASTO_OPERATIVO
  debe_usd DECIMAL DEFAULT 0.0,
  haber_usd DECIMAL DEFAULT 0.0,
  debe_ves DECIMAL DEFAULT 0.0,
  haber_ves DECIMAL DEFAULT 0.0,
  descripcion TEXT
);

-- Cierres de caja (Cierre Ciego)
CREATE TABLE IF NOT EXISTS cierres_caja (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha          DATE    NOT NULL,
  declarado_usd  DECIMAL NOT NULL,
  teorico_usd    DECIMAL NOT NULL,
  diferencia_usd DECIMAL NOT NULL,
  estado         TEXT    CHECK(estado IN ('OK','ALERTA','FALTANTE')) NOT NULL,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Retrocompatibilidad Tarea 01
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compras (Abastecimiento)
CREATE TABLE IF NOT EXISTS compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  proveedor TEXT,
  total_usd REAL DEFAULT 0.0,
  observaciones TEXT
);

-- Detalles de Compras
CREATE TABLE IF NOT EXISTS compra_detalles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_compra INTEGER,
  id_insumo INTEGER,
  cantidad INTEGER NOT NULL,
  costo_unitario_usd REAL NOT NULL,
  FOREIGN KEY(id_compra) REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY(id_insumo) REFERENCES insumos(id)
);

-- Lotes de Insumos (FIFO)
CREATE TABLE IF NOT EXISTS insumo_lotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_insumo INTEGER NOT NULL,
  id_compra INTEGER NOT NULL,
  cantidad_inicial INTEGER NOT NULL,
  cantidad_actual INTEGER NOT NULL,
  costo_unitario_usd REAL NOT NULL,
  fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(id_insumo) REFERENCES insumos(id),
  FOREIGN KEY(id_compra) REFERENCES compras(id) ON DELETE CASCADE
);

-- Migraciones
-- Nota: En SQLite no hay 'ADD COLUMN IF NOT EXISTS'. 
-- Estos fallarán si ya existen, lo cual es manejado por el motor de BD al inicializar si se desea.
-- Para esta implementación simple, los dejamos como referencia de evolución del esquema.
-- ALTER TABLE facturas ADD COLUMN metodo_pago TEXT DEFAULT 'EFECTIVO_USD';
-- ALTER TABLE facturas ADD COLUMN detalle_pago TEXT;

-- Liquidaciones de Médicos (Tarea 11)
CREATE TABLE IF NOT EXISTS liquidaciones_medicos (
  id                INTEGER  PRIMARY KEY AUTOINCREMENT,
  id_medico         INTEGER  NOT NULL,
  fecha_pago        DATE     NOT NULL,
  monto_pagado_usd  REAL     NOT NULL CHECK(monto_pagado_usd > 0),
  tasa_cambio       REAL     NOT NULL DEFAULT 1,
  monto_pagado_ves  REAL     NOT NULL DEFAULT 0.0,
  metodo_pago       TEXT     NOT NULL DEFAULT 'EFECTIVO_USD'
                             CHECK(metodo_pago IN ('EFECTIVO_USD','EFECTIVO_VES','TRANSFERENCIA_VES','TRANSFERENCIA_USD','PAGO_MOVIL')),
  notas             TEXT,
  creado_en         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(id_medico) REFERENCES medicos(id)
);
