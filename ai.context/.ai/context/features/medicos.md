# Módulo: Médicos (Módulo Separado)

## Campos de Registro
1. **Nombre:** Completo con título profesional.
2. **Especialidad:** Área médica de desempeño.
3. **Porcentaje de Comisión:** Valor decimal (e.g., 0.70 para 70% de la consulta).
4. **Estatus:** Activo / Inactivo.

## Interfaz de Búsqueda
- **Barra de Búsqueda Predictiva:** Filtrado por nombre de médico.
- **Módulo Independiente:** No se mezcla con Servicios, se gestiona en su propia pestaña.

## Lógica de Negocio
- La comisión se calcula sobre el total bruto de la factura vinculada a este médico.
- Se debe poder cambiar el porcentaje de comisión histórico sin afectar facturas ya cerradas (inmutabilidad retroactiva).
