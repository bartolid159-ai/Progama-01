# Plan Tarea 07 — Revisión Arquitectónica v2 (Post-Sesión Anterior)

**Fecha:** 2026-04-12 | **Autor:** Arquitecto de Software (Modo Plan) | **Estado:** PENDIENTE APROBACIÓN

---

## 1. Diagnóstico: PRD v2 vs Código Actual

### ✅ Ya implementado en la sesión anterior
| Requisito PRD | Código Actuial | Veredicto |
|---|---|---|
| Asiento COSTO_INSUMO en `processInvoice` | `manager.js` L437-445 | ✅ Completo |
| `reportService.js` con `getKpiDia`, `getStockAlertas`, `getFlujoDiario` | `src/logic/reportService.js` (89 líneas) | ✅ Completo |
| Dashboard con `KpiPanel`, `RevenueChart`, `StockAlertWidget` | `src/components/Dashboard/` | ✅ Completo |
| Tests unitarios de `reportService` (4/4 en verde) | `tests/reportService.test.js` | ✅ Completo |
| Fix de entorno de test (`isBrowser && NODE_ENV !== 'test'`) | `manager.js` L35 | ✅ Completo |

---

### ❌ Brechas Nuevas detectadas en el PRD v2

El PRD actualizado agrega 4 requisitos que **NO existen** en el código ni en el schema actual:

#### BRECHA 1 — Esquema Contable Incorrecto (§8 del PRD)
El PRD ahora especifica una tabla `contabilidad_asientos` con columnas **bimoneda** (`debe_usd`, `haber_usd`, `debe_ves`, `haber_ves`) y `tasa_referencia`. El schema actual usa `asientos_contables` con columna `monto_usd` simple (moneda única). Esto impide los reportes de **Auditoría de Tasas** del §4.8.

| PRD §8 requiere | Schema actual (`schema.sql`) | Brecha |
|---|---|---|
| `contabilidad_asientos` con `debe_usd`, `haber_usd`, `debe_ves`, `haber_ves`, `tasa_referencia` | `asientos_contables` con `monto_usd`, `descripcion` | ❌ Tabla con distinto nombre y estructura |
| `historial_tasas` (fecha, valor_bcv) | No existe | ❌ Tabla faltante |

#### BRECHA 2 — Catálogo de Insumos Incompleto (§4.4)
La tabla `insumos` actual (schema L36-43) no tiene: `codigo`, `descripcion`, `id_categoria`. La `tarea-09-gestion-insumos.md` lo describe pero el schema no se ha migrado.

#### BRECHA 3 — Módulo de Compras/Abastecimiento (§4.5)
PRD §4.5 requiere: tablas `compras` y `compra_detalles` para registrar entrada de stock. No existen en `schema.sql`. Detallado en `tarea-10-compras-y-recetas.md` pero no implementado.

#### BRECHA 4 — Dashboard Panel de Rentabilidad (§7.3)
PRD §7.3 exige: Ranking Pareto de los 5 servicios por **utilidad neta real** (no solo facturación bruta). El `getTopServicios()` actual solo ordena por revenue, no cruza con costo de insumos.

---

### ⚠️ Tareas Obsoletas o Requieren Revisión

| Archivo | Estado | Razón |
|---|---|---|
| `plan-tarea-07-dashboard-reportes.md` | ⚠️ SUPERSEDED | El plan anterior no contemplaba brechas de esquema bimoneda. |
| `tarea-07-dashboard-y-reportes.md` | ⚠️ OBSOLETA PARCIAL | Solo 15 líneas. Ya implementada al 80%, pero falta la integración de `historial_tasas`. |
| `tarea-09-gestion-insumos.md` | ⚠️ DESACTUALIZADA | Describe `insumos` correctamente pero la tabla del schema aún no tiene `codigo`, `descripcion`, `id_categoria`. Requiere migración de schema antes de implementar UI. |
| `tarea-10-compras-y-recetas.md` | ⚠️ BLOQUEANTE | No implementada. El PRD §4.5 la marca como módulo core. Bloquea el cálculo de costo promedio ponderado. |

---

## 2. Cambios necesarios para migrar al PRD v2

### FASE A — Migración del Esquema de Datos (Bloqueante para todo lo demás)

#### [MODIFY] `src/db/schema.sql`

**A1.** Renombrar/migrar `asientos_contables` → `contabilidad_asientos` con estructura bimoneda:
```sql
CREATE TABLE IF NOT EXISTS contabilidad_asientos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha           DATETIME DEFAULT CURRENT_TIMESTAMP,
  tasa_referencia DECIMAL,
  referencia_id   INTEGER,
  tipo            TEXT,        -- INGRESO, EGRESO
  categoria       TEXT,        -- SERVICIO, COSTO_INSUMO, COMISION
  debe_usd        DECIMAL,
  haber_usd       DECIMAL,
  debe_ves        DECIMAL,
  haber_ves       DECIMAL,
  descripcion     TEXT
);
```

**A2.** Agregar tabla `historial_tasas`:
```sql
CREATE TABLE IF NOT EXISTS historial_tasas (
  fecha      DATE PRIMARY KEY,
  valor_bcv  DECIMAL NOT NULL
);
```

**A3.** Extender tabla `insumos` con nuevas columnas:
```sql
-- Agregar: codigo TEXT, descripcion TEXT, id_categoria INTEGER
CREATE TABLE IF NOT EXISTS categorias_insumos (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);
```

---

### FASE B — Adaptar `manager.js` al nuevo esquema

#### [MODIFY] `src/db/manager.js`

- Actualizar todas las referencias de `asientos_contables` → `contabilidad_asientos`.
- Actualizar `insertAsiento` para registrar `debe_usd/haber_usd` y `debe_ves/haber_ves` usando la tasa del día desde `historial_tasas`.
- Agregar función `getTasaDelDia()` que consulta `historial_tasas` y devuelve la tasa más reciente.
- Agregar función `registrarTasa(fecha, valorBcv)` para la actualización manual diaria.

---

### FASE C — Adaptar `reportService.js` al nuevo esquema

#### [MODIFY] `src/logic/reportService.js`

- `getKpiDia()`: Cambiar `SUM(monto_usd)` → `SUM(debe_usd) - SUM(haber_usd)` conforme a la lógica de débito/crédito.
- `getFlujoDiario()`: Adaptar a la nueva estructura de columnas.
- `getTopServicios()`: **Nuevo cálculo** — cruzar factura_detalles con costo real de insumos para obtener **utilidad neta** por servicio (Pareto real).
- `[NEW]` `getAuditoriaTasas(fechaDesde, fechaHasta)` → historial de tasas para re-expresión financiera.
- `[NEW]` `getKardexInsumo(id_insumo)` → historial de movimientos con valorización.

---

### FASE D — UI: Módulo de Gestión de Insumos (Tarea 09 actualizada)

#### [NEW] `src/components/Insumos/InsumoList.jsx`
- Tabla con columnas: Código, Nombre, Categoría, Stock Actual, Mínimo, Costo USD, **Costo Total**.
- Indicador visual (🔴/🟢) de estado de stock.
- Buscador predictivo por nombre o código.

#### [NEW] `src/components/Insumos/InsumoForm.jsx`
- Formulario con campos: `codigo`, `nombre`, `descripcion`, `id_categoria`, `stock_actual`, `stock_minimo`, `costo_unitario_usd`.

---

### FASE E — UI: Panel de Rentabilidad del Dashboard (§7.3)

#### [MODIFY] `src/components/Dashboard/Dashboard.jsx`
- Agregar **Ranking Pareto** de los 5 servicios con mayor utilidad neta (consumiendo `getTopServicios()` mejorado).
- Agregar **Widget de Tasa del Día** con campo editable para actualización manual.

---

### FASE F — Tests obligatorios

#### [MODIFY] `tests/reportService.test.js`
- Agregar casos para `getAuditoriaTasas`.
- Actualizar tests existentes para el nuevo esquema bimoneda (columnas `debe_usd`, `haber_usd`).

#### [NEW] `tests/insumos.test.js`
- CRUD completo de insumos.
- Cálculo de Costo Total (stock × costo_unitario).
- Alerta de stock mínimo.

---

## 3. Orden de Ejecución Atómica

1. `schema.sql` → Migración de tablas (sin romper datos existentes)
2. `manager.js` → Actualizar nombre de tabla y lógica bimoneda + `getTasaDelDia()`
3. `reportService.js` → Adaptar queries + añadir `getTopServicios()` real + `getAuditoriaTasas()`
4. Dashboard → Widget de Tasa + Pareto de servicios
5. Insumos UI → `InsumoList` + `InsumoForm` (Tarea 09)
6. `npm test` → todos los suites en verde

---

## 4. Criterios de Aceptación

- [ ] El asiento contable registra `debe_usd`, `haber_usd`, `debe_ves`, `haber_ves` y `tasa_referencia`.
- [ ] El Dashboard muestra la tasa BCV del día y permite actualizarla manualmente.
- [ ] El Ranking Pareto cruza monto de servicio contra costo real de insumos (utilidad neta, no revenue bruto).
- [ ] La tabla `insumos` tiene campos `codigo`, `descripcion`, `id_categoria`.
- [ ] `npm test` pasa 100% con los nuevos casos bimoneda.

---

> ⛔ **DETENCIÓN OBLIGATORIA** — Para iniciar la implementación responde:
> **"Plan aprobado, procede con la implementación"**
