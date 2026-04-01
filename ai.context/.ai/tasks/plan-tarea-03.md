# Plan de Implementación - Tarea 03: Módulo de Gestión de Pacientes

## 1. Análisis de Impacto
### Archivos Existentes a Modificar:
- **[MODIFY] [manager.js](file:///c:/Users/Admin/Desktop/Programa%2001/src/db/manager.js)**: Ya se agregaron `searchPatients` y `getAllPatients`. Se verificará si se requiere manejo de errores específico para 'UNIQUE constraint' en `insertPaciente`.
- **[MODIFY] [App.jsx](file:///c:/Users/Admin/Desktop/Programa%2001/src/App.jsx)**: Se implementará el ruteo básico o estado de navegación para alternar entre el Dashboard y el módulo de Pacientes.
- **[MODIFY] [index.css](file:///c:/Users/Admin/Desktop/Programa%2001/src/index.css)**: Se añadirán estilos para el formulario (2 columnas), tablas modernas y el banner de éxito/error.

## 2. Nuevos Archivos a Crear
- **[NEW] `src/logic/patientService.js`**: Capa intermedia que gestiona la lógica de negocio, validaciones de frontend y comunicación con la base de datos.
- **[NEW] `src/components/Patients/PatientList.jsx`**: Vista de tabla con buscador predictivo integrado.
- **[NEW] `src/components/Patients/PatientForm.jsx`**: Formulario modal para creación/edición de pacientes (7 campos).
- **[NEW] `src/components/Common/Banner.jsx`**: Componente reutilizable para notificaciones (Guardado exitoso).

## 3. Lógica de Negocio a Implementar
- **Búsqueda Predictiva**: Implementación de un `debounce` en el input de búsqueda para no saturar la base de datos, filtrando por Nombre o Cédula (usando `LIKE %query%`).
- **Validación de Duplicados**: El `patientService` verificará si la cédula ya existe antes de intentar insertar, o capturará el error de SQLite para mostrar un mensaje al usuario.
- **Gestión de Datos**: Mapeo de los campos del formulario (Nombre, Cédula/RIF, Sexo, Fecha de Nacimiento, Teléfono, Correo, Dirección) hacia el esquema de la DB.
- **Consumo de DB**: Dado que es una app local-first, el servicio invocará directamente al `manager.js`. Para el desarrollo en navegador (Vite), se preparará un "guard" o mock si `better-sqlite3` no puede ejecutarse en el contexto de la ventana.

## 4. Definición de Tests (Vitest)
- **`tests/unit/patientService.test.js`**:
    - Test: No debe permitir insertar pacientes con campos obligatorios vacíos.
    - Test: Debe retornar error legible cuando la cédula está duplicada.
    - Test: La búsqueda debe filtrar correctamente resultados por coincidencia parcial.
- **`tests/unit/PatientForm.test.jsx`**:
    - Test: El formulario debe renderizar los 7 campos requeridos.
    - Test: El botón de "Guardar" debe estar deshabilitado si hay errores de validación inicial.

---
> [!IMPORTANT]
> **Plan aprobado, procede con la implementación** (Esperando esta frase confirmatoria según `AGENT.md`).
