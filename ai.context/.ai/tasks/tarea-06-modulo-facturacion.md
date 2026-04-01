# Tarea 06: Pantalla de Facturación e Interconexión

## Objetivo
Desarrollar el núcleo del ERP: El formulario de facturación multimoneda con descuento automático de inventario y generación de asientos.

## Archivos Afectados
- `src/components/Billing/InvoiceForm.jsx`
- `src/logic/billingEngine.js`
- `src/db/triggers` (Verificación de triggers SQL)

## Criterio de Éxito
- Se pueden añadir múltiples servicios.
- Al guardar la factura, el stock de insumos baja automáticamente.
- Se genera el total en USD y VES según la tasa del día.
