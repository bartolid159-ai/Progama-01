# Plan de Implementación: Tarea 09 - CRUD de Insumos y Categorías

## 1. Análisis de impacto en archivos existentes
- `src/db/schema.sql`: Se añadirán las tablas `categorias_insumos` y `insumos`. Se insertarán datos semilla para categorías base (Material Médico, Limpieza, Oficina).
- `src/db/manager.js`: Se agregarán los métodos CRUD (crear, leer, actualizar, eliminar) tanto para `categorias_insumos` como para `insumos`.
- `src/App.jsx`: Se incluirá la ruta o renderizado del nuevo componente principal del módulo de insumos (`<Supplies />`) y el botón en el menú de navegación principal.

## 2. Nuevos archivos a crear
- **Componentes React (UI):**
    - `src/components/Supplies/SuppliesList.jsx`: Vista principal para mostrar la tabla de insumos, incluyendo el buscador predictivo y los filtros por categoría.
    - `src/components/Supplies/SupplyForm.jsx`: Formulario en modal o vista dedicada para el registro y edición de insumos y categorías.
- **Tests (Vitest):**
    - `tests/supplies.test.js`: Suite de pruebas unitarias y de integración para asegurar el correcto funcionamiento del manager.js respecto a estas nuevas tablas y cálculos.

## 3. Lógica de negocio a implementar
- **Validación de Stock Mínimo (UI & Logic):** Se evaluará en tiempo real si `stock_actual <= stock_minimo`. De ser así, se enviará un flag a la UI para renderizar las filas afectadas en rojo (alerta crítica).
- **Cálculo de Costo Total (Lógica):** Por cada insumo, se debe calcular la propiedad virtual `costo_total = stock_actual * costo_unitario` (formateado a dos decimales).
- **Buscador Predictivo:** Implementación de un filtro frontend sobre el listado de insumos considerando coincidencias en `nombre` o `codigo`.
- **Restricciones Local-First:** Todo correrá sobre SQLite `dbManager`, asegurando persistencia sin llamadas de red a la nube y con validación estricta en DB de llaves foráneas (`id_categoria` debe existir).

## 4. Definición de los tests de Vitest necesarios
- **Tests de Creación:** Validar la exitosa inserción de Categorías e Insumos en la BD.
- **Casos Borde Faltantes:** Validar que los campos obligatorios (`codigo`, `nombre`, `stock_actual`, `id_categoria`) impidan la grabación si están vacíos.
- **Test de Cálculo de Costos:** Asegurar que `costo_total` retorne el valor matemático exacto esperado para cantidades enteras y precisas.
- **Test de Stock Negativo:** Verificar que el sistema rechace registros con stocks o costos negativos.
- **Tests de Filtrado:** Confirmar que una función de búsqueda retorna los elementos correctos base a un query y un id de categoría.
