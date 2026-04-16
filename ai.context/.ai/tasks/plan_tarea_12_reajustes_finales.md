# Plan de Tarea 12: Reajustes Finales de Módulos y Borrado de Facturas

Este plan detalla las modificaciones finales solicitadas para el sistema MédicaERP, incluyendo la reorganización de módulos y la implementación de una función de seguridad para eliminar facturas del historial.

## 1. Análisis de Impacto y Requerimientos

### 1.1 Reorganización de Módulos
- **Módulo Reportes**: Se eliminará por completo ya que se encuentra vacío.
- **Módulo Dashboard**: Se renombrará a **"Contabilidad"** y se moverá a la última posición en el menú lateral.
- **Consistencia Visual**: Los títulos de las páginas y estados internos deben reflejar este cambio.

### 1.2 Registro de Facturas
- **Funcionalidad**: Añadir un botón de eliminación en cada fila del historial de facturas.
- **Seguridad**: Se debe solicitar una clave antes de proceder con la eliminación.
- **Integridad de Datos**: Al borrar una factura, se deben eliminar sus detalles (`factura_detalles`) y sus asientos contables asociados (`contabilidad_asientos`) para mantener la coherencia financiera.

## 2. Cambios Propuestos

### 2.1 Backend / Base de Datos (`src/db/manager.js`)
- Crear función `deleteFactura(id)` que:
    1. Inicie una transacción.
    2. Elimine los registros en `factura_detalles` asociados al ID.
    3. Elimine los asientos en `contabilidad_asientos` donde `referencia_id = id` y la categoría sea relacionada con la factura (SERVICIO, COMISION, COSTO_INSUMO).
    4. Elimine el registro principal en `facturas`.
- Implementar soporte para `localStorage` en la función de borrado (para el modo navegador/demo).

### 2.2 Componentes de Interfaz

#### `src/App.jsx`
- Eliminar la entrada de "Reportes" en la lista `nav-links`.
- Renombrar "Dashboard" a "Contabilidad" en la lista y en la función `getPageTitle`.
- Reordenar la lista para que "Contabilidad" (antes Dashboard) sea el último elemento.

#### `src/components/Common/SecurityModal.jsx` (Nuevo)
- Crear un componente de modal que solicite una contraseña.
- Incluir un campo de input tipo `password` con estética premium.
- Propiedades: `isOpen`, `onConfirm(password)`, `onCancel`.

#### `src/components/Billing/InvoiceHistory.jsx`
- Añadir columna "Acciones" en la tabla.
- Incluir botón con icono de papelera (🗑️) con estilo de peligro.
- Integrar `SecurityModal` para validar la acción.
- Función de verificación de contraseña (por ahora contra un valor fijo o el usuario admin si está disponible).

## 3. Lógica de Negocio y Seguridad
- La clave de seguridad se verificará inicialmente contra una constante o una consulta rápida a la tabla `users`. Para este requerimiento final, utilizaremos una validación robusta que busque al usuario `admin`.

## 4. Definición de Tests (Vitest)
Se crearán pruebas en `tests/unit/InvoiceDeletion.test.jsx` para validar:
1. Que la función `deleteFactura` elimina correctamente de todas las tablas relacionadas.
2. Que la transacción se revierte si ocurre un error intermedio.
3. Que el historial de facturas se refresca después del borrado.

## 5. Criterios de Aceptación
- [ ] Menú lateral reorganizado correctamente.
- [ ] El módulo de Dashboard ahora se llama Contabilidad y es el último.
- [ ] El módulo de Reportes no existe.
- [ ] Cada factura en el historial tiene un botón de borrar.
- [ ] Al hacer clic en borrar, se pide una clave.
- [ ] Si la clave es correcta, la factura desaparece del registro y de la contabilidad.
- [ ] Todos los tests pasan en verde.
