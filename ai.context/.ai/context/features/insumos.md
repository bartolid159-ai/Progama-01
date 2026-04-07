# Módulo de Insumos y Abastecimiento

## Resumen
Gestión integral del inventario de la clínica, permitiendo el control de costos, existencias y la reposición mediante compras a proveedores.

## Especificaciones de Datos

### Campos del Insumo
- **Código (SKU):** Identificador único.
- **Nombre:** Nombre comercial del producto.
- **Descripción:** Detalles adicionales.
- **Categoría:** Grupo al que pertenece (ej. Quirúrgico, Oficina, Fármacos).
- **Stock Actual:** Cantidad disponible en tiempo real.
- **Stock Mínimo:** Umbral para disparar alertas.
- **Costo Unitario (USD):** Último costo de adquisición.
- **Costo Total (USD):** Calculado como `stock_actual * costo_unitario`.

### Registro de Compras
Cada compra debe registrar:
1. **Insumo:** Referencia al catálogo.
2. **Cantidad:** Unidades ingresadas.
3. **Costo Unitario:** Al actualizarse aquí, debe impactar el costo unitario del catálogo principal.
4. **Proveedor:** Nombre o referencia del origen.

## Lógica de Negocio

### Recetas Técnicas
- Los **Servicios** pueden tener una lista de insumos asociados.
- Al facturar el servicio, se debe:
    1. Consultar la receta técnica.
    2. Validar disponibilidad de stock.
    3. Restar del `stock_actual`.
    4. Registrar el "Costo de Ventas" basado en el costo unitario vigente del insumo.

### Alertas de Inventario
- El Dashboard filtrará automáticamente los insumos donde `stock_actual <= stock_minimo`.
- Se requiere un widget visual rojo/amarillo para estos ítems.
