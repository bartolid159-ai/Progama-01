# Plan de Implementación: Tarea 10 (Compras y Recetas)

## 1. Análisis de Impacto en Archivos Existentes
- **`src/db/manager.js`**:
  - Modificación del esquema de inicialización (añadir tablas de compras y relaciones).
  - Ajuste del método de facturación (`createInvoice` o equivalente) para que consulte la "receta" asociada a cada servicio procesado.
  - Generación del cargo contable automatizado en `contabilidad_asientos` equivalente al "costo de ventas" (costo unitario de los insumos usados).
- **Módulo de Servicios (UI)**: Extender el formulario de creación/edición de Servicios para vincular `x` cantidad de insumos.
- **Módulo de Facturación (UI)**: Agregar lógica de validación de estado de stock en tiempo real antes de finalizar factura y mostrar alertas de faltantes.

## 2. Nuevos Archivos a Crear
- **`src/pages/Purchases.jsx/tsx`**: Módulo del Catálogo e Historial de compras.
- **`tests/compras-recetas.test.js`**: Pruebas unitarias e integración de flujos de stock (ingreso, costeo, descuento).

## 3. Lógica de Negocio a Implementar
- **Base de Datos**: 
  - `compras` (id, fecha, proveedor, total_usd).
  - `compra_detalles` (compra_id, insumo_id, cantidad, costo).
  - `receta_servicio` (servicio_id, insumo_id, cantidad).
- **Descuentos y Costeo (FIFO/Costo Promedio)**: El costo unitario de los Insumos se actualizará o utilizará el registrado en la última compra.
- **Seguridad Contable**: Transacciones atómicas (BEGIN/COMMIT). Si la factura falla, ni el stock se altera, ni los asientos se alteran.

## 4. Definición de Tests (Vitest)
1. **🧪 Abastecimiento**: Registrar una compra correcta debe aumentar la tabla de Insumos sumando `N` cantidad y actualizando su costo unitario.
2. **🧪 Integración de Facturación**: Facturar un servicio con una receta de insumos debe reducir exactamente la cantidad consumida.
3. **🧪 Asientos Contables**: Se debe verificar que se agregó una entrada negativa/debe en `contabilidad_asientos` (Costo de venta).
4. **🧪 Casos Bordes**: 
   - Intentar guardar factura vacía de stock genera Error o bloqueo.
   - Intento concurrente debe bloquearse según las reglas ACID.
