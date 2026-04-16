# Plan de Tarea: Corrección de Tests en CI

## 1. Análisis de Impacto
- **Archivos:** `src/components/Billing/InvoiceForm.test.jsx`
- **Impacto:** Ninguno en el código de producción. Solo corrige la ambigüedad en los tests para que el CI pase satisfactoriamente.

## 2. Nuevos Archivos
- Ninguno.

## 3. Lógica de Negocio
- No hay cambios en la lógica de negocio.

## 4. Tests de Vitest
- Se utiliza la suite existente: `src/components/Billing/InvoiceForm.test.jsx`.
- La prueba `debe validar que los dígitos sean 4 en pagos electrónicos` debe pasar (ya verificado localmente).
