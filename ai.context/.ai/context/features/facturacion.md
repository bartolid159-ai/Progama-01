# Módulo: Facturación y Cobros

## Componentes de Interfaz
1. **Selector de Paciente:** Con buscador predictivo.
2. **Selector de Médico:** Con buscador predictivo (sugiere el médico del servicio).
3. **Selector de Servicios:** Permite añadir múltiples servicios a una sola factura.
4. **Tasa de Cambio:** Widget que muestra la tasa USD/VES del día.
5. **Método de Pago:** Selector desplegable con las opciones:
   - `EFECTIVO_USD` — El cliente paga en billetes físicos en dólares.
   - `TRANSFERENCIA` — Pago bancario. Requiere los últimos 4 dígitos de la referencia.
   - `PAGO_MOVIL` — Pago móvil (P2P). Requiere los últimos 4 dígitos de la referencia.
6. **Referencia / Descripción de Billetes:**
   - Si el método es `TRANSFERENCIA` o `PAGO_MOVIL`: campo de texto corto para los **últimos 4 dígitos** de la referencia bancaria.
   - Si el método es `EFECTIVO_USD`: campo de texto libre para describir los **billetes entregados** (ej. "2x$20, 1x$10").

## Lógica de Cálculo
- **Subtotal USD:** Suma de servicios.
- **IVA:** Calculado por ítem (si aplica).
- **Total USD:** Subtotal + IVA.
- **Total VES:** Total USD * Tasa de Cambio del día.

## Historial de Facturas
El historial debe mostrar, por cada factura:
- Método de pago (icono + etiqueta visual).
- Referencia o descripción de billetes (`detalle_pago`).

## Interconexión Crítica
1. **Deducción de Stock:** Al registrar, busca en la receta del servicio y resta del inventario.
2. **Comisión Médica:** Genera el asiento contable del pasivo al médico.
3. **Registro Contable:** Crea el asiento de ingreso.
