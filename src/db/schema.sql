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

-- Inventario de Insumos
CREATE TABLE IF NOT EXISTS insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  unidad_medida TEXT,
  costo_unitario_usd REAL DEFAULT 0.0
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

-- Contabilidad y Flujo 
CREATE TABLE IF NOT EXISTS asientos_contables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT, -- INGRESO, EGRESO
  categoria TEXT, -- SERVICIO, INSUMO, COMISION, GASTO_OPERATIVO
  monto_usd REAL,
  descripcion TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  id_referencia INTEGER
);

-- Cierres de caja diarios
CREATE TABLE IF NOT EXISTS cierres_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  monto_teorico_usd REAL,
  monto_declarado_usd REAL,
  diferencia REAL,
  notas TEXT
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
