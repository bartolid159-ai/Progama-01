# Plan de Implementación: Corrección de Carga en Navegador (Pantalla en Blanco)

## 1. Análisis del Problema
La aplicación muestra una pantalla en blanco en el navegador porque Vite intenta empaquetar `better-sqlite3` (un módulo nativo de Node.js) al detectar la importación dinámica en `patientService.js`. El navegador lanza errores al no encontrar módulos internos de Node como `fs` o `path`.

## 2. Propuesta de Solución
Se aplicará una técnica para "esconder" la importación de la base de datos del analizador de dependencias de Vite durante la ejecución en el navegador, permitiendo que la lógica de simulación (mocks) funcione correctamente sin intentar cargar módulos nativos.

### Cambios en Archivos:

#### [MODIFY] [patientService.js](file:///c:/Users/Admin/Desktop/Programa%2001/src/logic/patientService.js)
- Cambiar la importación dinámica de una ruta estática a una ruta construida dinámicamente o protegida.
- Reforzar los checks de entorno para asegurar que nunca se intente instanciar el manager en el cliente.

#### [MODIFY] [vite.config.js](file:///c:/Users/Admin/Desktop/Programa%2001/vite.config.js)
- (Opcional si lo anterior falla) Configurar `build.rollupOptions.external` para ignorar explícitamente `better-sqlite3`.

## 3. Lógica de Negocio
- No hay cambios en la funcionalidad de pacientes.
- Se asegura la compatibilidad dual: **Vitest** (usa SQLite real) vs **Navegador** (usa Mocks).

## 4. Verificación
1. Reiniciar el servidor con `npm run dev`.
2. Verificar con el subagente de navegación que el DOM ya no esté vacío y que no existan errores de `better-sqlite3` en la consola.
3. Confirmar que el Dashboard y la lista de Pacientes (Mock) sean visibles.

---
> [!IMPORTANT]
> **Plan aprobado, procede con la implementación** (Esperando esta frase confirmatoria).
