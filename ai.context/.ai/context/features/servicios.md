# Módulo: Servicios (Módulo Separado)

## Campos de Configuración
1. **Nombre del Servicio:** (e.g., Consulta Ginecología).
2. **Precio USD:** Valor base en dólares.
3. **Impuesto:** Toggle Exento (por defecto) o 16% IVA.
4. **Médico por Defecto:** Selección del médico que ofrece el servicio (opcional).
5. **Receta Técnica (Insumos):** Lista de insumos vinculados con su cantidad necesaria.

## Interfaz de Búsqueda
- **Barra de Búsqueda Predictiva:** Filtrado por nombre de servicio.

## Lógica de Negocio
- Al cargar un servicio en la factura, el sistema debe sugerir automáticamente el médico y cargar la lista de insumos para el descuento de stock.
- La modificación de un precio de servicio no afecta facturas previoas.

## Estado de Implementación
- [x] Registro de servicios con receta de insumos - IMPLEMENTADO
- [x] Edición de servicios con actualización de insumos - IMPLEMENTADO
- [x] Visualización de insumos en lista de servicios - IMPLEMENTADO
- [x] Descuento automático de stock al facturar - IMPLEMENTADO (en billingEngine.js)

## Datos de Prueba
Para verificar el módulo:
1. Crear al menos 2 insumos en el catálogo de insumos
2. Registrar un servicio y asociarle los insumos con cantidad
3. Editar el servicio y verificar que los insumos se actualicen correctamente
4. Facturar el servicio y verificar el descuento de stock
