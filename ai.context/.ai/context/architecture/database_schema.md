# Esquema de Base de Datos (SQLite)

## Tablas Principales

### `configuracion`
- `id`: INTEGER PRIMARY KEY
- `clave`: TEXT UNIQUE (e.g., 'tasa_cambio_usd_ves', 'nombre_clinica')
- `valor`: TEXT
- `ultima_actualizacion`: DATETIME

### `pacientes`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `cedula_rif`: TEXT UNIQUE
- `nombre`: TEXT
- `sexo`: TEXT (M/F/Otro)
- `fecha_nacimiento`: DATE
- `telefono`: TEXT
- `correo`: TEXT
- `direccion`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `medicos`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `nombre`: TEXT
- `especialidad`: TEXT
- `porcentaje_comision`: REAL (0.00 a 1.00)
- `activo`: BOOLEAN DEFAULT 1

### `insumos`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `nombre`: TEXT
- `stock_actual`: INTEGER
- `stock_minimo`: INTEGER
- `unidad_medida`: TEXT (unidades, ml, etc.)
- `costo_unitario_usd`: REAL

### `servicios`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `nombre`: TEXT
- `precio_usd`: REAL
- `es_exento`: BOOLEAN DEFAULT 1
- `id_medico_defecto`: INTEGER (FK -> medicos.id)

### `servicio_insumos`
- `id_servicio`: INTEGER (FK -> servicios.id)
- `id_insumo`: INTEGER (FK -> insumos.id)
- `cantidad`: INTEGER
- PRIMARY KEY (id_servicio, id_insumo)

## Tablas Transaccionales

### `facturas`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `id_paciente`: INTEGER (FK -> pacientes.id)
- `id_medico`: INTEGER (FK -> medicos.id)
- `fecha`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `tasa_cambio`: REAL
- `total_usd`: REAL
- `total_ves`: REAL
- `estatus`: TEXT (PAGADA, ANULADA)

### `factura_detalles`
- `id_factura`: INTEGER (FK -> facturas.id)
- `id_servicio`: INTEGER (FK -> servicios.id)
- `cantidad`: INTEGER
- `precio_unitario_usd`: REAL
- `iva_porcentaje`: REAL

### `asientos_contables`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `tipo`: TEXT (INGRESO, EGRESO)
- `categoria`: TEXT (SERVICIO, INSUMO, COMISION, GASTO_OPERATIVO)
- `monto_usd`: REAL
- `descripcion`: TEXT
- `fecha`: DATETIME
- `id_referencia`: INTEGER (ID de factura o pago)

### `cierres_caja`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `fecha`: DATETIME
- `monto_teorico_usd`: REAL
- `monto_declarado_usd`: REAL
- `diferencia`: REAL
- `notas`: TEXT
