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
- La modificación de un precio de servicio no afecta facturas previas.
