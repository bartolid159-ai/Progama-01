# Plan de Implementación: Tarea 07 — Dashboard y Reportes Segmentados

## Objetivo
Construir un Dashboard funcional con KPIs reales (Ganancia Neta = Ventas - Costos - Comisiones),
gráficas de rendimiento y alertas de stock crítico, conectados a los datos de `asientos_contables`
e `insumos` ya presentes en el esquema SQLite.

---

## 1. Análisis de Impacto en Archivos Existentes

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Añadir `<Dashboard>` en la vista `dashboard` (reemplaza KPIs hardcodeados) |
| `src/App.jsx` | Agregar ítem de nav **Reportes** (`activeView='reports'`) |
| `src/db/manager.js` | Agregar 3 consultas de lectura: KPIs del día, top-servicios, alertas stock |

---

## 2. Nuevos Archivos a Crear

```
src/
├── logic/
│   └── reportService.js          # Capa de agregación de datos
├── components/
│   └── Dashboard/
│       ├── KpiPanel.jsx           # 3 tarjetas KPI en tiempo real
│       ├── StockAlertWidget.jsx   # Lista de insumos bajo mínimo
│       └── RevenueChart.jsx       # Gráfica Ingresos vs Egresos (SVG puro)
tests/
└── reportService.test.js          # Tests unitarios obligatorios
```

---

## 3. Lógica de Negocio a Implementar

### 3.1 `reportService.js` — 4 funciones puras
- `getKpiDia(db)` → Consulta `asientos_contables` filtrando por `fecha = hoy`:
  - `ingresos_usd` = SUM donde `tipo='INGRESO'`
  - `egresos_usd`  = SUM donde `tipo='EGRESO'`
  - `ganancia_neta_usd` = ingresos − egresos
- `getTopServicios(db, limite=5)` → JOIN `factura_detalles + servicios`, GROUP BY servicio, ORDER BY suma DESC
- `getStockAlertas(db)` → SELECT insumos donde `stock_actual <= stock_minimo`
- `getFlujoDiario(db, diasAtras=30)` → Ingresos y Egresos agrupados por día (para gráfica)

### 3.2 `KpiPanel.jsx`
- Llama `getKpiDia()` en `useEffect` al montar
- Muestra 3 tarjetas: Ganancia Neta (verde/rojo), Total Ingresos, Total Egresos
- Spinner de carga; valor real en USD

### 3.3 `StockAlertWidget.jsx`
- Llama `getStockAlertas()` — lista roja si hay alertas, verde si todo OK
- Muestra nombre, stock actual vs mínimo

### 3.4 `RevenueChart.jsx`
- Gráfica de barras SVG pura (sin librerías externas) con datos de `getFlujoDiario()`
- Barras azul = ingresos, rojo = egresos por día

---

## 4. Tests Obligatorios (`tests/reportService.test.js`)

- ✅ `getKpiDia` retorna `{ganancia_neta_usd: 0}` cuando no hay asientos
- ✅ `getKpiDia` calcula correctamente: ingresos 100, egresos 40 → neta 60
- ✅ `getStockAlertas` retorna [] cuando todo el stock es suficiente
- ✅ `getStockAlertas` retorna los insumos con stock crítico
- ✅ `getTopServicios` ordena por total DESC y respeta el límite

---

## 5. Orden de Ejecución Atómica

1. `manager.js` — añadir funciones de consulta de reportes
2. `reportService.js` — lógica pura de agregación
3. `KpiPanel.jsx` + `StockAlertWidget.jsx` + `RevenueChart.jsx`
4. `App.jsx` — conectar `<Dashboard>` real y añadir nav **Reportes**
5. `reportService.test.js` — ejecutar `npm test` y confirmar verde

---

## 6. Criterios de Aceptación

- [ ] KPI Ganancia Neta muestra valor real desde SQLite (no hardcodeado)
- [ ] Widget de stock crítico muestra insumos bajo mínimo con badge rojo
- [ ] Gráfica SVG renderiza barras de ingresos vs egresos de los últimos 30 días
- [ ] Todos los tests en verde (`npm test`)

---

**DETENCIÓN OBLIGATORIA** — Esperando aprobación: `Plan aprobado, procede con la implementación`
