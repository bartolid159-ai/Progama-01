# Plan Tarea 06.1: Mejoras al Módulo de Facturación

**Base sobre la que se construye:** `InvoiceForm.jsx` ya existe y procesa facturas en memoria. 
Esta tarea la extiende con persistencia real, historial consultable y corrección del input de tasa.

---

## Problema 1: Persistencia de Facturas (Manager DB)
- **Archivo:** `src/db/manager.js` [MODIFY]
- **Qué falta:** La función `processInvoice` no existe aún. La UI llama a `onProcessComplete` 
  pero no guarda nada en SQLite.
- **Solución:** Crear `processInvoice(invoiceData)` que ejecute una transacción ACID:
  1. `INSERT` en `facturas` → obtener `lastInsertRowid`.
  2. `INSERT` en `factura_detalles` por cada item.
  3. Descontar stock en `insumos` via `servicio_insumos`.
  4. `INSERT` de asiento contable (INGRESO + COMISION).
- **También:** `getAllFacturas()` para el historial con `JOIN` a `pacientes`.
- **También:** `searchFacturas(query)` que filtre por nombre, cédula, teléfono o fecha.

---

## Problema 2: Vista de Historial de Facturas
- **Archivo:** `src/components/Billing/InvoiceHistory.jsx` [NEW]
- **Qué hace:**
  - Tabla con columnas: N° Factura, Fecha, Paciente, Cédula, Teléfono, Médico, 
    Total USD, Total VES, Estatus.
  - Buscador predictivo en la parte superior (busca por nombre, cédula o fecha).
  - Diseño consistente con el resto del sistema (misma clase `patient-list`, 
    `modern-table`, `glassmorphism`).
- **Datos:** Usa `manager.searchFacturas()` y `manager.getAllFacturas()`.

---

## Problema 3: Botón de Acceso al Historial
- **Archivo:** `src/App.jsx` [MODIFY]
- **Dónde:** En el header de la vista de facturación, al lado del título "Facturación".
- **Qué hace:** Alterna entre `activeSubView === 'form'` y `activeSubView === 'history'`.
- **Estilo:** Botón secundario `btn-secondary` con ícono 📋.

---

## Problema 4: Fix del Input de Tasa de Cambio
- **Archivo:** `src/components/Billing/InvoiceForm.jsx` [MODIFY]
- **Bug actual (línea 241):**
  ```js
  onChange={(e) => setExchangeRate(Number(e.target.value) || 0)}
  ```
  El `Number()` convierte el string vacío a `0`, que luego se muestra en el input.
- **Solución:** Cambiar a `type="text"` con validación numérica manual, 
  o mantener `type="number"` pero gestionar el estado como `string` para evitar 
  el `0` automático:
  ```js
  const [exchangeRateStr, setExchangeRateStr] = useState('36');
  const exchangeRate = parseFloat(exchangeRateStr) || 0;
  onChange={(e) => setExchangeRateStr(e.target.value)}
  ```

---

## Flujo de Navegación Resultante
```
Sidebar: "Facturación"
  └── Vista de Facturación
        ├── [Encabezado] Botón "📋 Historial" (alterna subvista)
        ├── SubVista: FORM  → InvoiceForm.jsx (formulario actual + save real)
        └── SubVista: HISTORY → InvoiceHistory.jsx (tabla + buscador)
```

---

## Archivos a Modificar/Crear
| Archivo | Acción |
|---|---|
| `src/db/manager.js` | MODIFY — añadir `processInvoice`, `getAllFacturas`, `searchFacturas` |
| `src/components/Billing/InvoiceHistory.jsx` | NEW — vista de historial |
| `src/components/Billing/InvoiceForm.jsx` | MODIFY — fix tasa de cambio + conectar a `processInvoice` |
| `src/App.jsx` | MODIFY — añadir estado `billingSubView` y botón en header |

---

## Criterio de Éxito
1. Procesar una factura → aparece en la tabla del Historial de inmediato.
2. Buscar por nombre del paciente → la tabla filtra correctamente.
3. Buscar por fecha → muestra solo las facturas de ese día.
4. El campo de tasa de cambio permite escribir libremente (ej: `144`, `36.5`).
