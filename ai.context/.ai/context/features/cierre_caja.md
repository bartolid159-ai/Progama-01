# Módulo: Cierre de Caja

## Definición de "Cierre Ciego"
- El cajero no ve el monto esperado por el sistema.
- El cajero debe ingresar físicamente cuánto dinero tiene en caja (USD/VES).

## Interfaz de Cierre
1. **Campos:** Monto en Efectivo USD, Monto en Efectivo VES, Monto en Transferencia.
2. **Confirmación:** Botón de finalizar turno.

## Lógica de Sistema
- El sistema suma todas las facturas del turno.
- **Cálculo de Diferencia:** Real vs. Teórico.
- Genera un reporte de cierre que solo el Administrador puede auditar.
