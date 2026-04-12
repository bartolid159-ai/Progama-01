# Plan de Implementación: Tarea 08 — Cierre de Caja Ciego y Backups

## Objetivo
Cerrar el flujo operativo del turno con un mecanismo de cierre de caja **ciego** (el cajero declara
primero, el sistema revela la diferencia después) y un sistema de **respaldo automático** del
archivo SQLite al salir de la aplicación.

---

## 1. Análisis de Impacto en Archivos Existentes

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Agregar ítem de nav **Caja** (`activeView='cashClosing'`) y renderizar `<CashClosing>` |
| `src/db/manager.js` | Añadir `getTeoricoCaja(fecha)` → SUM de cobros del día desde `contabilidad_asientos` |
| `src/logic/reportService.js` | Añadir `calcularDiferenciaCaja(declarado, teorico)` → retorna `{diferencia, estado}` |
| `electron/main.js` *(si existe)* | Escuchar evento `before-quit` para disparar el backup automático |

---

## 2. Nuevos Archivos a Crear

```
src/
├── components/
│   └── Settings/
│       └── CashClosing.jsx        # UI del cierre ciego (formulario + reveal)
├── logic/
│   └── backupService.js           # Lógica de copia del archivo SQLite
tests/
└── backupService.test.js          # Tests obligatorios
```

---

## 3. Lógica de Negocio

### 3.1 `CashClosing.jsx` — Flujo en 3 pasos (UI de estado)

**Paso 1 – Declaración Ciega:**
- El cajero introduce los montos recibidos por método de pago:
  - Efectivo USD | Efectivo VES | Transferencia VES | Transferencia USD | Pago Móvil
- Botón **"Cerrar Caja"** — solo activo si al menos un campo tiene valor > 0.

**Paso 2 – Reveal (post-submit):**
- Se consulta `getTeoricoCaja(hoy)` → monto total teórico registrado en DB.
- Se muestra la tabla comparativa:

  | Concepto | Declarado (USD) | Sistema (USD) | Diferencia |
  |---|---|---|---|
  | Total | X | Y | ±Z |

- **Semáforo visual:**
  - 🟢 Verde: diferencia = 0
  - 🟡 Amarillo: diferencia ≤ 5 USD
  - 🔴 Rojo: diferencia > 5 USD

**Paso 3 – Registro:**
- Guarda el cierre en tabla `cierres_caja` (ver §5) y muestra botón para imprimir/exportar.

---

### 3.2 `backupService.js` — 2 funciones

```js
// Copia el archivo .sqlite a una carpeta /backups con timestamp
async function crearBackup(dbPath, backupDir)
// Limpia backups con más de N días (default: 30)
async function limpiarBackupsAntiguos(backupDir, diasMax = 30)
```

- El backup se guarda como: `clinica_YYYY-MM-DD_HH-mm.sqlite`
- En entorno web/Vite (dev): simula la acción con un `console.log` (la lógica real es Electron).
- Se dispara desde `App.jsx` en el evento `beforeunload` del browser (dev) o `before-quit` de Electron.

---

### 3.3 `manager.js` — Nueva consulta

```js
// Retorna la suma de cobros del día desde contabilidad_asientos
async function getTeoricoCaja(fecha = hoy)
// INSERT en tabla cierres_caja
async function guardarCierreCaja({ fecha, declarado_usd, teorico_usd, diferencia_usd, estado })
```

---

## 4. Esquema de Datos Nuevo

```sql
CREATE TABLE IF NOT EXISTS cierres_caja (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha          DATE    NOT NULL,
  declarado_usd  DECIMAL NOT NULL,
  teorico_usd    DECIMAL NOT NULL,
  diferencia_usd DECIMAL NOT NULL,
  estado         TEXT    CHECK(estado IN ('OK','ALERTA','FALTANTE')) NOT NULL,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> Se añade en el bloque `initializeDatabase()` de `manager.js`.

---

## 5. Tests Obligatorios (`tests/backupService.test.js`)

- ✅ `calcularDiferenciaCaja(100, 100)` → `{ diferencia: 0, estado: 'OK' }`
- ✅ `calcularDiferenciaCaja(97, 100)` → `{ diferencia: -3, estado: 'ALERTA' }`
- ✅ `calcularDiferenciaCaja(80, 100)` → `{ diferencia: -20, estado: 'FALTANTE' }`
- ✅ `crearBackup` lanza error descriptivo si `dbPath` no existe
- ✅ `limpiarBackupsAntiguos` no elimina archivos recientes (stub de `fs`)

---

## 6. Orden de Ejecución Atómica

1. `manager.js` → añadir `getTeoricoCaja` + `guardarCierreCaja` + CREATE TABLE `cierres_caja`
2. `reportService.js` → añadir `calcularDiferenciaCaja`
3. `backupService.js` → implementar `crearBackup` + `limpiarBackupsAntiguos`
4. `CashClosing.jsx` → UI completa del flujo ciego en 3 pasos
5. `App.jsx` → enlazar nav **Caja**, montar evento `beforeunload`
6. `backupService.test.js` → ejecutar `npm test` y confirmar verde

---

## 7. Criterios de Aceptación

- [ ] El cajero **no ve** el monto del sistema hasta pulsar "Cerrar Caja"
- [ ] El semáforo muestra el color correcto según la diferencia calculada
- [ ] El cierre queda registrado en `cierres_caja` con `estado` correcto
- [ ] Al cerrar/recargar la app, se genera (o simula) el backup del `.sqlite`
- [ ] Todos los tests en verde (`npm test`)

---

**DETENCIÓN OBLIGATORIA** — Esperando aprobación: `Plan aprobado, procede con la implementación`
