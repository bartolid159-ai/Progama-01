# Plano Maestro: Sistema de Gestión para Consultorios Médicos

## 1. Visión del Producto
Un sistema ERP local-first diseñado para la gestión administrativa eficiente de consultorios médicos, optimizando el flujo de facturación, control de inventario y liquidación de comisiones a profesionales, con cumplimiento contable bimoneda (USD/VES).

## 2. Objetivos Principales
- **Agilidad en Cobros:** Reducir el tiempo de facturación en el punto de venta.
- **Automatización Contable:** Sincronizar cada venta con el inventario, el costo de ventas y las comisiones médicas.
- **Transparencia Financiera:** Reportar ganancias netas reales deduciendo costos e incentivos.
- **Seguridad y Resiliencia:** Funcionamiento 100% local con respaldos automatizados.

## 3. Perfiles de Usuario
- **Administrador / Dueño:** Acceso total al sistema, reportes financieros, configuración de porcentajes y auditoría.
- **Cajero (Rol de sistema):** Gestión de facturación y cierre de caja "ciego" para evitar fugas de capital.
- **Médicos:** No interactúan directamente con el sistema para facturación, pero son la base del cálculo de comisiones.

## 4. Módulos y Funcionalidades

### 4.1 Base de Datos de Pacientes
- Fichas detalladas: ID (Cédula/RIF), Nombre, Teléfono, Correo, **Sexo, Fecha de Nacimiento y Dirección**.
- Historial de servicios consumidos (sin notas médicas clínicas profundas).

### 4.2 Catálogo de Médicos (Módulo Separado)
- Registro independiente de profesionales con especialidad y **porcentaje de comisión** configurable por cada uno.

### 4.3 Catálogo de Servicios (Módulo Separado)
- Gestión de servicios con precio en USD y flag `es_exento`.
- **Interconexión Directa:** Al registrar un servicio, permite seleccionar:
    1. **Médico Asociado:** El profesional que ofrece el servicio por defecto.
    2. **Insumos Asociados (Receta):** Lista de materiales del inventario que se descuentan automáticamente (opcional).

### 4.4 Gestión de Insumos (Catálogo y Categorías)
- **Registro Detallado:** Código/SKU, Nombre, Descripción, Categoría, Stock Actual, Stock Mínimo y Costo Unitario.
- **Cálculo Automático de Valor:** El sistema debe mostrar el "Costo Total" por ítem (Stock Actual * Costo Unitario).
- **Categorización:** Capacidad de agrupar insumos (ej. Material Médico, Medicamentos, Limpieza) para filtrado rápido.
- **Alertas:** Widget visual en Dashboard para niveles de stock por debajo del mínimo configurado.

### 4.5 Registro de Compras (Abastecimiento)
- **Módulo de Entrada:** Interfaz para registrar la llegada de nuevos insumos.
- **Flujo:** Selección de Insumo + Cantidad Recibida + Costo Unitario Actualizado.
- **Impacto:** Actualiza automáticamente el `stock_actual` y el `costo_unitario` en el catálogo principal.
- **Historial:** Bitácora simple de compras por fecha y proveedor.

### 4.6 Facturación y Cobros
- Selección rápida de Paciente, Servicio y Médico tratante.
- **Buscadores Predictivos:** Todas las barras de búsqueda (Clientes, Servicios, Médicos) deben filtrar resultados en tiempo real mientras el usuario escribe.
- Manejo de impuestos: Exento por defecto, 16% IVA seleccionable para venta de insumos sueltos.
- **Conversión en Tiempo Real:** Total en USD, pago aceptado en VES según tasa del día.

### 4.7 Módulo de Liquidación de Médicos

- Resumen diario/semanal de facturación segmentado por médico.
- Cálculo automático de "Por pagar" basado en el porcentaje acordado sobre la factura bruta.

### 4.8 Contabilidad y Reportes Avanzados
- Dashboard con **Ganancia Neta del Día** (Ventas - Costo Insumos - Comisiones).
- **Segmentación de Datos:** Capacidad de visualizar y filtrar Ingresos y Egresos por:
    - **Servicio:** Cuáles generan más rentabilidad.
    - **Médico:** Productividad por profesional.
    - **Tiempo:** Diarios, Mensuales y Anuales.
    - **Categoría:** Diferenciación entre ingresos por servicios vs. venta de insumos sueltos.


## 5. Lógica de Interconexión (Core Engine)
Al procesar una factura:
1. **Inventario:** Se descuentan automáticamente los insumos asociados al servicio prestado.
2. **Contabilidad (Costo):** Se registra el costo de los insumos (basado en el último costo unitario registrado) como un egreso de inventario.
3. **Contabilidad (Comisiones):** Se genera un pasivo (cuenta por pagar) al médico basado en su porcentaje.
4. **Cierre de Caja:** El cajero declara el efectivo/transferencia recibido. El sistema compara contra el teórico y reporta faltantes/sobrantes al Administrador.

## 6. Especificaciones Técnicas
- **Infraestructura:** Aplicación local de escritorio.
- **Persistencia:** SQLite (Alto rendimiento para 300-500 facturas/mes).
- **Monedas:** 
    - Funcional: USD.
    - Presentación/Legal: VES (Bolívares).
    - Tasa de cambio: Actualización manual diaria al abrir el sistema.
- **Respaldos:** Prompt de exportación de `.sqlite` al cerrar la aplicación (USB/Cloud).

## 7. Diseño Visual (Dashboard)
- **KPI Primario:** Ganancia Neta del día.
- **Gráficas:**
    1. Ranking de servicios (Pareto).
    2. Alerta de Stock (Widget rojo para insumos bajos).
    3. Flujo Mensual (Ingresos vs Egresos).
- **Estética:** Moderna, tipo "Clínica Digital", optimizada para carga rápida de datos (Quick-Input).
