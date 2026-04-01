# Módulo: Inventario e Insumos

## Gestión de Stock
- **Ingreso de Mercancía:** Aumenta el stock y actualiza el `costo_unitario_usd`.
- **Salida Automática:** Triggered por el módulo de Facturación.

## Campos Técnicos
1. **Nombre del Insumo.**
2. **Stock Actual.**
3. **Stock Mínimo (Alerta).**
4. **Unidad de Medida.**
5. **Costo Promedio USD.**

## Lógica de Negocio
- Validación de stock negativo (alertar si la factura vacía el inventario).
- El costo de ventas se calcula basándose en el costo del insumo al momento de la venta.
