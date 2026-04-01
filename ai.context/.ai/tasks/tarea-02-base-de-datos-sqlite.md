# Tarea 02: Base de Datos SQLite y Manager

## Objetivo
Implementar el esquema SQL de `database_schema.md` y crear el manager de conexión ACID para persistencia local.

## Archivos Afectados
- `src/db/schema.sql` (Creación de tablas y triggers)
- `src/db/manager.js` (Lógica de conexión y ejecución de queries)

## Criterio de Éxito
- La base de datos se inicializa correctamente al arrancar la app.
- Se puede realizar un registro de prueba y recuperarlo.
- El archivo `.sqlite` es visible en la carpeta del proyecto.
