# Plan de Corrección Definitivo: Sincronización de Keys en LocalStorage

## 1. Análisis de impacto y Causa Raíz Exacta
- **Archivos existentes a modificar**: `src/db/manager.js`
- **Causa raíz**: Aunque la lógica de descuento fue implementada en el fallback `isBrowser` de `processInvoice`, se descubrió una discrepancia en las llaves del `localStorage`. 
  - El módulo de gestión de insumos (`src/logic/insumoLogic.js`) guarda el inventario utilizando la llave `'clinica_insumos'`.
  - El archivo `src/db/manager.js` intenta leer y descontar utilizando la llave `'clinica_insumos_db'`.
  - Al estar operando sobre una llave vacía (`clinica_insumos_db`), se carga un arreglo vacío `[]`, no se encuentra el ID a descontar y no ocurre el débito real del stock visible en pantalla.

## 2. Nuevos archivos a crear
- Ninguno. Solución de 1 línea de código en backend.

## 3. Lógica de negocio a implementar
- Abrir el archivo `src/db/manager.js`.
- Localizar la definición de constantes (alrededor de la línea 19).
- Cambiar la definición de la constante para que coincida exactamente con la utilizada en insumos:
  ```javascript
  // Cambiar esta línea:
  // const INSUMOS_KEY = 'clinica_insumos_db';
  
  // Por esta línea:
  const INSUMOS_KEY = 'clinica_insumos';
  ```
- Opcional: Asegurarse de realizar un formateo limpio para no afectar otra dependencia.

## 4. Definición de pruebas
- Eliminar la base de datos previa o limpiar el `localStorage` en el navegador para evitar estados inconsistentes (incongruencia entre `clinica_insumos` y `clinica_insumos_db`).
- Procesar una factura desde la UI de desarrollo (`npm run dev`) y verificar en la pestaña **Insumos** que el stock ahora sí descuenta en la interfaz gráfica.
