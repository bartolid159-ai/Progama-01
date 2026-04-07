# Plan de Implementación - Tarea 06: Módulo de Facturación

Este plan detalla la creación del núcleo del ERP: el sistema de facturación e interconexión con inventario y contabilidad.

## 1. Lógica de Cálculo (Billing Engine)
- **Archivo:** `src/logic/billingEngine.js` [NEW]
- **Funcionalidad:**
    - `calculateTotals(items, exchangeRate)`: Calcula subtotal, IVA (si aplica), total en USD y total en VES.
    - `calculateCommission(total, percentage)`: Calcula el pasivo a favor del médico.
    - `getRequiredInsumos(items)`: Consolida la lista de materiales a descontar del inventario.

## 2. Componentes de Interfaz (UI)
- **Archivo:** `src/components/Billing/InvoiceForm.jsx` [NEW]
- **Características:**
    - Selector predictivo de **Paciente** (usando `searchPatients`).
    - Selector de **Médico** tratante (por defecto el del servicio, pero con override).
    - Grid dinámico de **Servicios**: Permite añadir múltiples líneas, cada una con su cantidad y precio.
    - Panel de Totales: Muestra montos en USD y VES en tiempo real.
    - Botón "Procesar Factura": Valida stock y dispara la transacción.

## 3. Persistencia y Transaccionalidad
- **Archivo:** `src/db/manager.js` [MODIFY]
- **Nueva Función:** `processInvoice(invoiceData)`
    - **Transacción ACID:**
        1. `INSERT` en `facturas`.
        2. `INSERT` en `factura_detalles` (por cada item).
        3. `UPDATE` stock en `insumos` (restando materiales asociados).
        4. `INSERT` en `asientos_contables` (Asiento de Ingreso y Pasivo de Comisión).

## 4. Integración en Navegación
- **Archivo:** `src/App.jsx` [MODIFY]
- **Cambios:**
    - Añadir `activeView === 'billing'` para renderizar `InvoiceForm`.
    - Integrar la opción en el Sidebar.

## 5. Verificación
- **Pruebas Unitarias:** Validar cálculos del motor con Vitest.
- **Pruebas de Integración:** Verificar que una factura de $10 reduce el stock de alcohol y genera $1 de comisión al 10%.
