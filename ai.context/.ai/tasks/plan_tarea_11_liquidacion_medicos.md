# Plan de Implementación: Tarea 11 — Módulo de Liquidación de Médicos

**Versión del Plan:** 1.0  
**Fecha:** 2026-04-13  
**Arquitecto:** Antigravity (Gemini)  
**Estado:** ⏸️ DETENIDO — Esperando aprobación: `Plan aprobado, procede con la implementación`

---

## 0. Contexto y Análisis Previo

### Estado actual del sistema (pre-tarea)
Al revisar el código existente se detectaron los siguientes puntos críticos:

1. **Pasivos ya se calculan:** En `processInvoice()` de `manager.js` (línea ~534), cada vez que se cierra una factura se inserta un asiento `{ tipo: 'EGRESO', categoria: 'COMISION' }` en `contabilidad_asientos` con el monto de la comisión en USD y VES. **Esta es la fuente de verdad para la liquidación.**

2. **Placeholder activo en la navegación:** `App.jsx` (línea 177) ya tiene `<li>Liquidación</li>` en el sidebar, pero sin `onClick` ni vista asociada. La integración será limpia.

3. **Tabla `liquidaciones_medicos` no existe:** El esquema actual (`schema.sql`) no tiene tabla para registrar pagos efectuados a médicos. Debe crearse.

4. **`doctorService.js` es el patrón a seguir:** Tiene el patrón dual `isBrowser / SQLite` bien establecido. El nuevo `liquidacionService.js` replicará esta arquitectura para compatibilidad dev/prod.

---

## 1. Análisis de Impacto en Archivos Existentes

| Archivo | Tipo de Cambio | Descripción |
|---|---|---|
| `src/db/schema.sql` | **MODIFY** | Agregar tabla `liquidaciones_medicos` |
| `src/db/manager.js` | **MODIFY** | Agregar 4 funciones de consulta/inserción para liquidaciones |
| `src/App.jsx` | **MODIFY** | Activar el ítem de nav "Liquidación" con `activeView='liquidation'`, agregar `case` en `getPageTitle()`, renderizar `<LiquidacionPanel>` |
| `src/logic/reportService.js` | **MODIFY** | Agregar función `getLiquidacionPorMedico()` que consolida comisiones pendientes y pagadas |

---

## 2. Nuevos Archivos a Crear

```
src/
├── components/
│   └── Liquidation/
│       ├── LiquidacionPanel.jsx      # Vista principal: tabla de médicos con saldo pendiente
│       └── LiquidacionDetalle.jsx    # Modal/drawer: detalle de facturas por médico y botón "Registrar Pago"
├── logic/
│   └── liquidacionService.js         # Capa de negocio: cálculo y persistencia de liquidaciones
tests/
└── liquidacionService.test.js        # Suite de tests obligatorios (Vitest)
```

---

## 3. Esquema de Datos Nuevo

### 3.1 Nueva tabla: `liquidaciones_medicos`

```sql
-- Registro de pagos efectuados a médicos (cierre de pasivo)
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
```

> Esta tabla se agrega al final de `schema.sql` y se inicializa automáticamente con el resto del esquema en `getDb()`.

---

## 4. Lógica de Negocio

### 4.1 Fórmula Central de Liquidación

```
Saldo Pendiente (USD) = SUM(comisiones_generadas_usd) - SUM(pagos_efectuados_usd)
```

donde:
- `comisiones_generadas_usd` → tabla `contabilidad_asientos` filtrada por `categoria = 'COMISION'` y `referencia_id` apuntando a facturas del médico en cuestión.
- `pagos_efectuados_usd` → tabla `liquidaciones_medicos` filtrada por `id_medico`.

### 4.2 `liquidacionService.js` — Funciones a implementar

```js
/**
 * Obtiene el resumen de liquidación de todos los médicos activos.
 * Retorna: [{ id_medico, nombre, especialidad, porcentaje_comision,
 *             total_generado_usd, total_pagado_usd, saldo_pendiente_usd }]
 */
export const getResumenLiquidaciones = async () => { ... }

/**
 * Obtiene el detalle de facturas que generaron comisión para un médico específico,
 * junto con el estado de pago de cada periodo.
 * @param {number} idMedico
 * @param {string} [fechaDesde] - Filtro opcional YYYY-MM-DD
 * @param {string} [fechaHasta] - Filtro opcional YYYY-MM-DD
 * Retorna: { medico, facturas: [...], pagos: [...], resumen: {...} }
 */
export const getDetalleLiquidacion = async (idMedico, fechaDesde, fechaHasta) => { ... }

/**
 * Registra un pago efectuado a un médico (cierra el pasivo parcial o total).
 * Valida que monto_pagado_usd > 0 y que no supere el saldo pendiente.
 * @param {{ id_medico, monto_pagado_usd, tasa_cambio, metodo_pago, notas }} pagoData
 */
export const registrarPago = async (pagoData) => { ... }

/**
 * Obtiene el historial de pagos registrados para un médico.
 * @param {number} idMedico
 */
export const getHistorialPagos = async (idMedico) => { ... }
```

### 4.3 Funciones en `manager.js` (capa de acceso a datos)

```js
// Retorna resumen agregado por médico desde contabilidad_asientos + liquidaciones_medicos
export const getResumenComisionesPorMedico = () => { ... }

// Retorna facturas + asientos COMISION de un médico en un rango de fechas
export const getComisionesMedico = (idMedico, fechaDesde, fechaHasta) => { ... }

// INSERT en liquidaciones_medicos
export const insertLiquidacion = (data) => { ... }

// SELECT historial de pagos de un médico
export const getLiquidacionesMedico = (idMedico) => { ... }
```

### 4.4 Query SQL principal (fuente de la tabla resumen)

```sql
SELECT
  m.id            AS id_medico,
  m.nombre,
  m.especialidad,
  m.porcentaje_comision,
  -- Total comisiones generadas por facturas del médico
  COALESCE(SUM(ca.haber_usd), 0)        AS total_generado_usd,
  -- Total pagado ya liquidado
  COALESCE(
    (SELECT SUM(lm.monto_pagado_usd)
     FROM liquidaciones_medicos lm
     WHERE lm.id_medico = m.id), 0)      AS total_pagado_usd,
  -- Saldo pendiente = generado - pagado
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
ORDER BY saldo_pendiente_usd DESC;
```

### 4.5 Fallback para entorno Navegador (localStorage)

Al igual que en todos los módulos, en modo `isBrowser`:
- Las comisiones se calculan cruzando `clinica_facturas_db` con `clinica_doctors_db` usando el `porcentaje_comision` de cada médico y el `total_usd` de cada factura.
- Los pagos registrados se persisten en `localStorage` con clave `clinica_liquidaciones_db`.
- El `saldo_pendiente` se calcula en memoria:
  ```
  saldo = sum(factura.totals.total_usd * (medico.porcentaje_comision / 100)) - sum(pagos.monto_pagado_usd)
  ```

---

## 5. UI: Componentes a Crear (Rediseño Estilo Facturación)

El diseño actual (tabla simple y modal) debe descartarse por completo para adoptar el layout premium y de doble columna de `InvoiceForm.jsx`, dividido en una pantalla principal de **Selección y Pago** y otra de **Historial de Pagos**.

### 5.1 `LiquidacionPanel.jsx` — Contenedor Principal y Tabs
- Contenedor con comportamiento responsivo (`animate-in`).
- **Navegación Interna (Tabs)** limpios ubicados en la parte superior:
  - 💵 Liquidar Médico (Vista Activa por defecto)
  - 📋 Historial de Pagos
- Ocultar vistas según el tab. El esquema cromático debe respetar el Dark Theme usando las clases y variables CSS maestras (`glassmorphism`, `inv-input`, `var(--bg-secondary)`).

### 5.2 Estructura del Formato de Pago (Estilo `InvoiceForm.jsx`)
La vista de "Liquidar Médico" será una pantalla dividida (`invoice-layout`):

**Columna Izquierda (`invoice-left glassmorphism`)**:
- **Selector de Médico**: Un combo o barra de búsqueda (`inv-input`) para elegir al médico.
- Al seleccionar, se renderiza una tarjeta (estilo `doctor-pill`) con Nombre, Especialidad y % de Comisión.
- **Detalle de Pasivos Generados**: Una tabla estilizada (`inv-items-table`) que desglose todas las facturas recientes que han generado estas comisiones, detallando fechas, nombre del paciente, total de factura y cuota correspondiente.

**Columna Derecha (`invoice-right`)**:
- **Resumen Financiero (`inv-summary glassmorphism`)**:
  - Comisión Bruta Generada
  - Abonos Previos (si aplica)
  - **SALDO FINAL A DEUDAR (USD y VES resaltados con `var(--accent-cyan)`)**.
- **Panel de Pago (`inv-payment glassmorphism`)**:
  - Formulario de monto a depositar (permitiendo pagos parciales).
  - Selector interactivo de Método (botones seleccionables `pay-btn` como en Facturación).
  - Input para Tasa de Cambio referencial y Referencia/Notas.
- **Botón `btn-procesar`**, bloqueado mientras guarde.

### 5.3 Elaboración y Exportación del Recibo (Ticket/PDF)
- Al completar un pago exitosamente, proporcionar acceso inmediato para ver el recibo.
- **Diseño del Recibo**: Debe ser un componente sumamente pulcro y estético. Se utilizarán diseños de comprobantes profesionales con el N° de recibo, desglose del pago en dólares/bolívares, información del médico y la fecha.
- Deberá usar CSS `@media print` para ocultar la UI administrativa, forzando la visualización centralizada que el usuario puede **Imprimir** o **Guardar como PDF** directamente desde el navegador de Node/Electron.

### 5.4 Historial de Pagos y Buscador (Estilo `InvoiceHistory.jsx`)
- Dentro del Tab "Historial de Pagos", mostrar el componente de la lista.
- **Barra de Búsqueda Premium (`inv-input` / `form-group`)**: Sin fondos blancos que rompan la estética; input directo para filtrar simultáneamente por **Número de Recibo**, **Médico**, o **Fecha**.
- **Tabla Estilizada (`modern-table glassmorphism`)**:
  - Columnas: Recibo N° (`color: var(--accent-cyan)`), Fecha, Médico, Pagado USD, Pagado VES, Método de Pago (usar `status-badge` con colores temáticos), Botón (Para re-imprimir recibo).
- Todo debe ser en tonos oscuros coherentes (`var(--text-main)`, `var(--bg-panel)`).

---

## 6. Función en `reportService.js`

```js
/**
 * Consolida el reporte de liquidación por médico para el período dado.
 * Usa getDb() directamente (entorno SQLite) o lógica localStorage (entorno browser).
 * @param {string} [fechaDesde]
 * @param {string} [fechaHasta]
 */
export const getLiquidacionPorMedico = (fechaDesde, fechaHasta) => { ... }
```

---

## 7. Modificación en `App.jsx`

### 7.1 Importaciones a agregar (3 líneas)
```jsx
import LiquidacionPanel from './components/Liquidation/LiquidacionPanel';
```

### 7.2 En `getPageTitle()` — agregar case
```js
case 'liquidation': return 'Liquidación de Médicos';
```

### 7.3 En el `<nav>` — activar el placeholder existente (línea 177)
```jsx
// ANTES (línea 177):
<li>Liquidación</li>

// DESPUÉS:
<li
  className={activeView === 'liquidation' ? 'active' : ''}
  onClick={() => setActiveView('liquidation')}
>
  💰 Liquidación
</li>
```

### 7.4 En el render condicional — agregar bloque
```jsx
{activeView === 'liquidation' && (
  <LiquidacionPanel onShowBanner={handleShowBanner} />
)}
```

---

## 8. Tests Obligatorios (`tests/liquidacionService.test.js`)

```js
// SUITE 1 — Cálculo de saldo pendiente
✅ getResumenLiquidaciones() retorna lista de médicos con campos correctos
✅ saldo_pendiente = total_generado - total_pagado (caso sin pagos)
✅ saldo_pendiente = 0 cuando total_pagado >= total_generado
✅ saldo_pendiente nunca es negativo (floor a 0)

// SUITE 2 — Validaciones de registrarPago()
✅ Rechaza pago con monto_pagado_usd <= 0 → { success: false }
✅ Rechaza pago que supera el saldo pendiente → { success: false, message: '...' }
✅ Acepta pago parcial válido → { success: true }
✅ Acepta pago total (cierre completo) → { success: true }

// SUITE 3 — Edge Cases contables
✅ Médico sin facturas → saldo_pendiente = 0 (no lanza error)
✅ Médico con facturas pero sin comisión (porcentaje = 0) → saldo_pendiente = 0
✅ Campo notas vacío → acepta sin error
✅ tasa_cambio = 0 → monto_pagado_ves = 0 (no falla, no divide por cero)

// SUITE 4 — Integración
✅ registrarPago() llama a insertLiquidacion() con los datos correctos
✅ getHistorialPagos() retorna lista vacía [] para médico sin pagos
```

---

## 9. Orden de Ejecución Atómica

El obrero debe implementar en este orden estricto para evitar dependencias rotas:

1. **`schema.sql`** → Añadir `CREATE TABLE IF NOT EXISTS liquidaciones_medicos (...)` al final del archivo.

2. **`manager.js`** → Añadir las 4 funciones al final del archivo:
   - `getResumenComisionesPorMedico()`
   - `getComisionesMedico(idMedico, fechaDesde, fechaHasta)`
   - `insertLiquidacion(data)` — con fallback `isBrowser` a `localStorage`
   - `getLiquidacionesMedico(idMedico)` — con fallback `isBrowser`

3. **`liquidacionService.js`** → Crear nuevo archivo con las 4 funciones de negocio. Seguir el patrón de `doctorService.js` con detección dual `isBrowser`.

4. **`reportService.js`** → Añadir `getLiquidacionPorMedico()` al final del archivo.

5. **`LiquidacionDetalle.jsx`** → Crear el componente modal/drawer de detalle primero (sin estado de App, es auto-contenido).

6. **`LiquidacionPanel.jsx`** → Crear el componente principal que consume `LiquidacionDetalle` y `liquidacionService`.

7. **`App.jsx`** → Activar la vista: importar `LiquidacionPanel`, corregir el `<li>` del nav, añadir el `case` en `getPageTitle()` y el bloque de render condicional.

8. **`tests/liquidacionService.test.js`** → Escribir todos los tests de las 4 suites y ejecutar `npm test` hasta confirmar ✅ verde.

---

## 10. Criterios de Aceptación

- [ ] El ítem "💰 Liquidación" en el sidebar está activo y navega a la vista correcta.
- [ ] La tabla principal muestra todos los médicos activos con sus saldos pendientes en tiempo real.
- [ ] Los badges de color (verde/amarillo/rojo) reflejan correctamente el estado del saldo.
- [ ] El modal de detalle muestra la lista de facturas generadoras de comisión del médico.
- [ ] El historial de pagos previos es visible en el modal.
- [ ] El formulario de pago valida: monto > 0 y monto ≤ saldo pendiente.
- [ ] Al registrar un pago, el saldo de la tabla principal se actualiza inmediatamente (re-fetch).
- [ ] Un formato visual (Aesthetic) de "Recibo de Pago" se muestra y se imprime correctamente (esconder la UI en modo `@media print`).
- [ ] La nueva pestaña o sección de Historial de Pagos incorpora buscadores por médico, número de recibo, y fecha, filtrando de manera precisa.
- [ ] El sistema funciona en modo navegador (localStorage) y en modo Electron (SQLite).
- [ ] Todos los tests en verde: `npm test` → 0 failures.

---

## 11. Verificación Final

Tras la implementación, el obrero debe:
1. Ejecutar `npm run dev` y navegar a la vista "Liquidación".
2. Verificar que la tabla carga médicos (usando los médicos de demostración del localStorage).
3. Abrir el detalle de un médico, registrar un pago de prueba ($10 USD) y confirmar que el saldo se actualiza.
4. Ejecutar `npm test` y capturar la salida con todos los tests en verde.
5. Hacer commit con mensaje: `feat(liquidacion): implementar modulo de liquidacion de medicos #tarea-11`.

---

**DETENCIÓN OBLIGATORIA** — No proceder con ningún cambio de código hasta recibir: `Plan aprobado, procede con la implementación`
