# Tarea 10: Registro de Compras y Recetas Técnicas

## Objetivo
Implementar el módulo de entrada de stock por compras a proveedores, y la asignación de recetas técnicas (insumos) a servicios para descuento automático al facturar.

## Acciones Requeridas

### 1. Base de Datos
- [ ] Crear tabla `compras` (id, fecha, proveedor, total_usd).
- [ ] Crear tabla `compra_detalles` (id_compra, id_insumo, cantidad, costo_unitario).
- [ ] Crear tabla/relación `receta_servicio` (id_servicio, id_insumo, cantidad_requerida).
- [ ] Implementar trigger o lógica que **sume stock** al insertar en `compra_detalles`.
- [ ] Implementar trigger o lógica que **actualice el costo unitario** del insumo al registrar una compra.

### 2. Módulo de Compras (UI)
- [ ] Formulario "Nueva Compra": campo de proveedor + tabla dinámica de ítems (Insumo, Cantidad, Costo Unitario).
- [ ] Historial de compras: listado con fecha, proveedor y total.
- [ ] Al guardar la compra, reflejar automáticamente los cambios en el catálogo de insumos.

### 3. Recetas Técnicas en Servicios (UI)
- [ ] En el formulario de Servicios, agregar sección "Insumos del Servicio (Receta)".
- [ ] Selección múltiple de insumos con cantidad requerida por cada uno.
- [ ] Mostrar resumen del costo de insumos por ejecución del servicio.

### 4. Integración con Facturación
- [ ] Al finalizar una factura, ejecutar el descuento de stock por cada servicio prestado.
- [ ] Registrar el costo de insumos como egreso contable en `asientos_contables`.
- [ ] Validar stock suficiente antes de finalizar: mostrar alerta si hay escasez.

## Criterio de Éxito
- Registrar una compra de 100 unidades de "Gel Ecográfico" aumenta el stock en 100.
- Al facturar "Ecografía" (receta: 2 unidades de Gel), el stock baja automáticamente 2.
- El Dashboard refleja el costo de insumos como egreso en la Ganancia Neta.
