-- Esquema Inicial para Programa Administrativo Local
-- FASE 1 & 2: Gestión de Pacientes y Médicos
-- FASE 3 & 4: Servicios y Facturación Bimoneda

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula_rif TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    sexo TEXT,
    fecha_nacimiento DATE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Médicos
CREATE TABLE IF NOT EXISTS medicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula_rif TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    especialidad TEXT,
    telefono TEXT,
    email TEXT,
    porcentaje_comision REAL DEFAULT 0,
    activo INTEGER DEFAULT 1
);

-- Insumos (Inventario Médico)
CREATE TABLE IF NOT EXISTS insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    unidad_medida TEXT, -- Ej: Und, ML, CC, Paquete
    stock_actual REAL DEFAULT 0,
    stock_minimo REAL DEFAULT 5,
    precio_costo_usd REAL DEFAULT 0,
    fecha_ultima_compra DATETIME
);

-- ServiciosMédicos
CREATE TABLE IF NOT EXISTS servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio_usd REAL NOT NULL,
    es_exento INTEGER DEFAULT 1, -- 1=Sí, 0=No (Aplica IVA)
    id_medico_defecto INTEGER,
    FOREIGN KEY (id_medico_defecto) REFERENCES medicos(id)
);

-- Relación Servicio - Insumos (Receta de materiales por servicio)
CREATE TABLE IF NOT EXISTS servicio_insumos (
    id_servicio INTEGER,
    id_insumo INTEGER,
    cantidad REAL NOT NULL, -- Cuanto se consume de este insumo por cada servicio
    PRIMARY KEY (id_servicio, id_insumo),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id),
    FOREIGN KEY (id_insumo) REFERENCES insumos(id)
);

-- Facturas (Cabecera)
CREATE TABLE IF NOT EXISTS facturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_paciente INTEGER NOT NULL,
    id_medico INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    tasa_cambio REAL NOT NULL,
    subtotal_usd REAL NOT NULL,
    iva_usd REAL NOT NULL,
    total_usd REAL NOT NULL,
    total_ves REAL NOT NULL,
    comision_medico_usd REAL DEFAULT 0,
    estatus TEXT DEFAULT 'PAGADA', -- PAGADA, ANULADA
    metodo_pago TEXT DEFAULT 'EFECTIVO_USD', -- EFECTIVO_USD, TRANSFERENCIA, PAGO_MOVIL
    detalle_pago TEXT, -- Diferencia ref o descripción de billetes
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
    FOREIGN KEY (id_medico) REFERENCES medicos(id)
);

-- Detalles de Factura
CREATE TABLE IF NOT EXISTS factura_detalles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_factura INTEGER NOT NULL,
    id_servicio INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario_usd REAL NOT NULL,
    es_exento INTEGER NOT NULL,
    FOREIGN KEY (id_factura) REFERENCES facturas(id),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id)
);

-- Historial de Consumo de Insumos (Trazabilidad)
CREATE TABLE IF NOT EXISTS consumo_insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_factura INTEGER NOT NULL,
    id_insumo INTEGER NOT NULL,
    cantidad_consumida REAL NOT NULL,
    costo_unitario_usd REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_factura) REFERENCES facturas(id),
    FOREIGN KEY (id_insumo) REFERENCES insumos(id)
);

-- Contabilidad (Asientos de Ingresos)
-- Para el Pareto de Ganancia Neta
CREATE TABLE IF NOT EXISTS contabilidad_asientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_factura INTEGER,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo TEXT NOT NULL, -- INGRESO, EGRESO
    referencia TEXT, -- "Ingreso por Factura #XXX"
    debe_usd REAL DEFAULT 0,
    haber_usd REAL DEFAULT 0,
    FOREIGN KEY (id_factura) REFERENCES facturas(id)
);

-- Cierres de Caja
CREATE TABLE IF NOT EXISTS cierres_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    teorico_usd REAL NOT NULL, -- Calculado por sistema
    declarado_usd REAL NOT NULL, -- Introducido por usuario (Cierre Ciego)
    diferencia_usd REAL NOT NULL,
    estado TEXT DEFAULT 'CERRADO', -- CERRADO, AJUSTADO
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
