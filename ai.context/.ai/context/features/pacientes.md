# Módulo: Pacientes

## Campos de Ficha
1. **Cédula/RIF:** Identificador único legal.
2. **Nombre Completo:** Campo obligatorio.
3. **Sexo:** Selección (Masc/Fem/Otro).
4. **Fecha de Nacimiento:** Selector de fecha para cálculo de edad.
5. **Teléfono:** Contacto principal.
6. **Correo:** Para envío de facturas digitales (opcional).
7. **Dirección:** Ubicación domiciliaria.

## Interfaz de Búsqueda
- **Barra de Búsqueda Predictiva:** Filtrado instantáneo por Cédula o Nombre mientras el usuario escribe.
- **Lista de Resultados:** Muestra Cédula, Nombre y Teléfono.

## Lógica de Negocio
- Un paciente puede tener múltiples facturas.
- Se debe validar que la Cédula no esté duplicada.
- Al seleccionar un paciente en la factura, se deben cargar sus datos automáticamente.
