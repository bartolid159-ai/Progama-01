# Tarea 09: CRUD de Insumos y Categorías

## Objetivo
Implementar la interfaz y lógica para gestionar el catálogo de insumos con sus costos y categorías.

## Acciones Requeridas

### 1. Base de Datos
- [ ] Crear tabla `categorias_insumos` (id, nombre).
- [ ] Crear tabla `insumos` con campos: `codigo`, `nombre`, `descripcion`, `id_categoria`, `stock_actual`, `stock_minimo`, `costo_unitario`.
- [ ] Poblar categorías base (Material Médico, Limpieza, Oficina).

### 2. Interfaz de Usuario (UI)
- [ ] Vista de listado de insumos con filtros por categoría.
- [ ] Mostrar columna calculada "Costo Total" (`stock * costo`).
- [ ] Formulario de registro/edición (sin unidad de medida).
- [ ] Implementar buscador predictivo por nombre o código.

### 3. Lógica
- [ ] Validación de stock mínimo para alertas (marcar en rojo si es crítico).

## Criterio de Éxito
- Se pueden crear, editar y eliminar insumos y categorías.
- El costo total se calcula correctamente en la tabla.
- El buscador filtra en tiempo real.
