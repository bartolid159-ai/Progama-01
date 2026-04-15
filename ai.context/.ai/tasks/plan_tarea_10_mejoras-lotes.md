# Plan de Implementación: Mejoras en Tarea 10 (Diseño, Detalles y Lotes)

## 1. Análisis de Impacto en Archivos Existentes
- **`src/db/manager.js` (o equivalente)**:
  - Modificación del esquema de base de datos para crear la tabla de `lotes` o `insumo_lotes`.
  - Actualización de la lógica de inserción de compras para que cada compra genere un lote independiente.
  - Actualización de la lógica de descuento en facturación para utilizar el método **FIFO (First In, First Out)**, deduciendo existencias de los lotes más antiguos hasta completar la cantidad reclamada por la receta.
  - Modificación de consultas de compras para traer los detalles de los insumos (nombre y cantidades) al historial.
- **`src/components/Purchases/PurchasesList.jsx`**:
  - Reestructuración visual completa de la tabla de historial de compras para que coincida con la estética *Premium* del programa.
  - Inserción de campos detallados para desglosar qué insumos y qué cantidades se trajeron exactamente y a qué precio, expandiendo o mostrando detalle por renglón.
- **`src/components/Inventory/...`**:
  - Ajustar la visualización del stock. Sumará la cantidad total del producto, pero permitiendo expandir o visualizar de qué lotes provienen y sus distintos costos de adquisición.

## 2. Nuevos Archivos a Crear / Tablas a Modificar
- **Esquema SQLite**:
  - **Tabla `insumo_lotes`**: `id`, `insumo_id`, `compra_id`, `cantidad_inicial`, `cantidad_actual`, `costo_unitario`, `fecha_ingreso`.
- **UI Components**:
  - Actualización en la UI de compras (`PurchasesList`) incorporando estilo "Glassmorphism", bordes redondeados, tipografía moderna, y efecto "hover".

## 3. Lógica de Negocio a Implementar (Lotes y FIFO)
- **Registro de Compras**: Cuando se reciba la compra de un proveedor, en vez de promediar o sobrescribir el costo del insumo base, se registrará en `compra_detalles` y se creará simultáneamente un registro en `insumo_lotes`.
- **Descuento en Facturación (FIFO)**:
  ```javascript
  // Ejemplo conceptual de la lógica a inyectar al facturar
  let cant_requerida = receta.cantidad;
  const lotes_disponibles = getLotesByInsumoOrderByFechaAsc(insumo.id);
  for (let lote of lotes_disponibles) {
     if (cant_requerida <= 0) break;
     let a_descontar = math.min(lote.cantidad_actual, cant_requerida);
     lote.cantidad_actual -= a_descontar;
     cant_requerida -= a_descontar;
     consumir_costo(lote.costo_unitario * a_descontar); // Egreso real
  }
  ```
- **Diseño**: Aplicar esquemas de colores armoniosos, espaciados amplios (padding), indicadores visuales (badges), e iconos modernos (p. ej. Lucide/Tailwind) para las filas expandibles de la tabla de compras.

## 4. Definición de Tests (Vitest)
1. **🧪 FIFO de Lotes**: Simular la compra de 50 guantes a $100 y luego 50 a $120. Consumir 60 guantes y validar que el stock queda en 40 (del último lote) y el costo contabilizado fue del lote respectivo.
2. **🧪 UI de Historial**: Verificar renderizado de los componentes de listado (no debe existir el texto crudo sino la lista de detalles por fila).
3. **🧪 Actualización de Inventario**: Verificar que el listado maestro de Inventario sume las existencias de múltiples lotes correctamente.
