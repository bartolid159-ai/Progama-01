# Plan de Implementación: Ajustes y Fix en Módulo de Liquidación de Médicos

Proporciona las especificaciones para solucionar los dos inconvenientes reportados por el usuario en el Módulo de Liquidación (Tarea 11): Ajustes de altura/layout para evitar scroll visual de los botones de pago, y resolución del bug lógico donde las comisiones generadas no aparecían en el recibo (cálculo fallido).

## User Review Required

> [!IMPORTANT]
> Revisa detenidamente los cambios. El layout se compactará reduciendo espacios en blanco para que elementos vitales se vean sin bajar la vista (scroll). Además, se reescribirá la lectura del total de la factura para soportar el formato anidado que usa el navegador.

## Proposed Changes

### Componentes de UI (Frontend)

Este componente presentará ajustes en la hoja de estilos en línea y sus clases para lograr compactar la vista y hacerla 100% visible:

#### [MODIFY] `src/components/Liquidation/LiquidacionPanel.jsx`
1. Ajuste de Altura de la grilla: de `calc(100vh - 180px)` pasará a `calc(100vh - 120px)`.
2. Cambio en las proporciones de las columnas en `.invoice-layout`.
3. Disminución de los `margin-top` aplicables en `.inv-payment` y `.inv-field` (de 20px/25px a 10px/15px).
4. Reducción de los espacios (paddings) en botones e inputs para que la altura de cada fila sea menor, habilitando que la vista "Confirmar y Registrar Pago" no quede escondida abajo.

### Lógica de Negocio y Base de Datos (Backend / Fallback)

El problema de las comisiones surge dado que, al registrar una factura en modo "Navegador" (`isBrowser`), el total se almacena anidado dentro de la propiedad `totals` de la estructura, pero la lectura posterior para comisiones espera la variable directa `total_usd`.

#### [MODIFY] `src/db/manager.js`
1. Modificar `getResumenComisionesPorMedico` (línea ~839): Cambiar `f.total_usd` por `(f.total_usd || f.totals?.total_usd || 0)`, asegurando que independientemente del modo (Electron vs Web) siempre se obtenga un valor numérico evitando que resulte en estado inválido (NaN).
2. Modificar `getComisionesMedico` (línea ~906): Hacer el mismo ajuste anterior para la propiedad `comision_calculada`. De esta forma logrando que se exprese el cálculo base correctamente cuando se presiona a un médico específico en la terminal de liquidación.

## Open Questions

> [!WARNING]
> ¿Las pantallas utilizadas por los encargados manejan resoluciones bajas (ej: pantallas pequeñas o Laptops a 1366x768)? De ser así, se le hará un mayor esfuerzo a reducir la altura de la grilla del layout.

## Verification Plan

### Automated Tests
- Ejecutar `npm run test` confirmando que todos los tests estén en verde posterior al respectivo update lógico. En los tests (`liquidacionService.test.js`) ya validamos integridades lógicas.

### Manual Verification
1. Hacer un cobro/factura de prueba asociando un insumo y un médico.
2. Ingresar a la sección "Liquidación", seleccionar el médico en el buscador izquierdo.
3. Observar la pantalla completa para garantizar que todos los inputs del pago y su botón queden en el alto del visor, sin descender para verlo.
4. Cerciorarse que el recuadro "Saldo Pendiente" calcule correctamente trayendo el total generado de la última factura hecha en el paso 1.
