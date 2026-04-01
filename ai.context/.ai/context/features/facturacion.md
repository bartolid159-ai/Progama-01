# Módulo: Facturación y Cobros

## Componentes de Interfaz
1. **Selector de Paciente:** Con buscador predictivo.
2. **Selector de Médico:** Con buscador predictivo (sugiere el médico del servicio).
3. **Selector de Servicios:** Permite añadir múltiples servicios a una sola factura.
4. **Tasa de Cambio:** Widget que muestra la tasa USD/VES del día.

## Lógica de Cálculo
- **Subtotal USD:** Suma de servicios.
- **IVA:** Calculado por ítem (si aplica).
- **Total USD:** Subtotal + IVA.
- **Total VES:** Total USD * Tasa de Cambio del día.

## Interconexión Crítica
1. **Deducción de Stock:** Al registrar, busca en la receta del servicio y resta del inventario.
2. **Comisión Médica:** Genera el asiento contable del pasivo al médico.
3. **Registro Contable:** Crea el asiento de ingreso.
