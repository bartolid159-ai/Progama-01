## Resumen
Corrige el descuento de stock en facturación y la asignación de insumos a servicios.

### Cambios realizados:
1. **ServiceForm.jsx** - Corregir para pasar insumos dentro del payload (no como segundo argumento)
2. **manager.js** - Implementar descuento de stock en `processInvoice` para entorno browser/localStorage
3. **manager.js** - Corregir key INSUMOS de `'clinica_insumos_db'` a `'clinica_insumos'` para coincidir con insumoLogic.js
4. **billingEngine.js** - Lógica de requiredInsumos para consolidar insumos de múltiples servicios
5. **ServicesUI.test.jsx** - Actualizar test para nueva firma del método
6. **features/servicios.md** - Documentar estado de implementación

### Tests:
- 12 tests pasando en serviceLogic y ServicesUI

### Cómo verificar:
1. Crear insumo con stock en módulo Insumos
2. Agregar insumo a Receta Técnica en módulo Servicios
3. Facturar el servicio
4. Verificar que el stock disminuye en módulo Insumos

---
Pull Request para rama: feature/tarea-09-stock-facturas → main