# Interconexiones de Flujo de Trabajo

## 1. Facturación -> Inventario
Al insertar un registro en `factura_detalles`:
- El sistema debe buscar en `servicio_insumos` los materiales asociados.
- Por cada insumo, se debe restar la `cantidad` del `stock_actual` en la tabla `insumos`.
- **Regla:** Si no hay stock suficiente, el sistema debe alertar pero permitir (configurable) o bloquear la factura.

## 2. Facturación -> Contabilidad (Comisiones)
Al finalizar una factura:
- Se identifica el `id_medico`.
- Se busca su `porcentaje_comision`.
- Se crea un registro en `asientos_contables` de tipo `EGRESO` y categoría `COMISION` por el monto: `total_factura * porcentaje`.

## 3. Facturación -> Contabilidad (Ingresos)
- Cada factura genera un registro de `INGRESO` categoría `SERVICIO`.
- Si se activa el IVA (16%), el ingreso base y el impuesto se desglosan en la lógica contable.

## 4. Cierre de Caja "Ciego"
- El sistema suma todas las facturas del día en `total_usd`.
- El cajero ingresa su conteo físico.
- **Diferencia = Declarado - Teórico**.
- Solo el Administrador puede ver el "Monto Teórico" antes del cierre.

## 5. Buscadores Predictivos
- Las consultas SQL deben usar `LIKE %termino%` o índices FTS para velocidad.
- Los resultados se cachean en el frontend para filtrado instantáneo tipo "autocomplete".
