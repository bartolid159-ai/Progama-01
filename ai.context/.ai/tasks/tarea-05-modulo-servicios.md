# Tarea 05: Módulo de Servicios e Insumos Asociados

## Objetivo
Crear la gestión de servicios vinculando médicos por defecto y recetas técnicas (insumos).

## Archivos Afectados
- `src/components/Services/ServiceForm.jsx` (Asociación con Médicos e Insumos)
- `src/logic/serviceLogic.js`

## Criterio de Éxito
- Al crear un servicio, se puede elegir un médico y una lista de insumos.
- El sistema guarda la relación en la tabla `servicio_insumos`.
- Flag de IVA exento/16% configurable por servicio.
