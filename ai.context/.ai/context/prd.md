# Plano Maestro: Sistema de Gestión para Consultorios Médicos

## 1. Visión del Producto
Un sistema ERP **local-first** diseñado para la gestión administrativa eficiente de consultorios médicos, optimizando el flujo de facturación, control de inventario y liquidación de comisiones a profesionales, con cumplimiento contable bimoneda (**USD/VES**).

---

## 2. Objetivos Principales
* **Agilidad en Cobros:** Reducir el tiempo de facturación en el punto de venta.
* **Automatización Contable:** Sincronizar cada venta con el inventario, el costo de ventas y las comisiones médicas sin intervención manual.
* **Transparencia Financiera:** Reportar ganancias netas reales deduciendo costos e incentivos en tiempo real.
* **Seguridad y Resiliencia:** Funcionamiento 100% local con respaldos automatizados.

---

## 3. Perfiles de Usuario
| Perfil | Descripción |
| :--- | :--- |
| **Administrador / Dueño** | Acceso total al sistema, reportes financieros, configuración de porcentajes y auditoría. |
| **Cajero (Rol de sistema)** | Gestión de facturación y cierre de caja "ciego" para evitar fugas de capital. |
| **Médicos** | No interactúan directamente con el sistema para facturación, pero son la base del cálculo de comisiones. |

---

## 4. Módulos y Funcionalidades

### 4.1 Base de Datos de Pacientes
* **Fichas detalladas:** ID (Cédula/RIF), Nombre, Teléfono, Correo, Sexo, Fecha de Nacimiento y Dirección.
* **Historial:** Registro de servicios consumidos (sin notas médicas clínicas profundas).

### 4.2 Catálogo de Médicos
* Registro independiente de profesionales con especialidad.
* Porcentaje de comisión configurable por cada médico.

### 4.3 Catálogo de Servicios
* Gestión de servicios con precio en USD y flag `es_exento`.
* **Interconexión Directa:** Al registrar un servicio, permite seleccionar:
    * **Médico Asociado:** Profesional que ofrece el servicio por defecto.
    * **Insumos Asociados (Receta):** Lista de materiales del inventario que se descuentan automáticamente (opcional).

### 4.4 Gestión de Insumos (Catálogo y Categorías)
* **Registro Detallado:** Código/SKU, Nombre, Descripción, Categoría, Stock Actual, Stock Mínimo y Costo Unitario.
* **Cálculo Automático de Valor:** Visualización del "Costo Total" por ítem ($Stock Actual \times Costo Unitario$).
* **Categorización:** Agrupamiento por Material Médico, Medicamentos, Limpieza, etc.
* **Alertas:** Widget visual en Dashboard para niveles de stock críticos.

### 4.5 Registro de Compras (Abastecimiento)
* **Módulo de Entrada:** Interfaz para registrar la llegada de nuevos insumos.
* **Flujo:** Selección de Insumo + Cantidad Recibida + Costo Unitario Actualizado.
* **Impacto:** Actualiza automáticamente el `stock_actual` y el `costo_unitario` en el catálogo principal.
* **Historial:** Bitácora simple de compras por fecha y proveedor.

### 4.6 Facturación y Cobros
* Selección rápida de Paciente, Servicio y Médico tratante.
* **Buscadores Predictivos:** Filtrado de resultados en tiempo real en todas las barras de búsqueda.
* **Manejo de impuestos:** Exento por defecto, 16% IVA seleccionable para venta de insumos sueltos.
* **Conversión en Tiempo Real:** Total en USD, pago aceptado en VES según tasa del día.

### 4.7 Módulo de Liquidación de Médicos
* Resumen diario/semanal de facturación segmentado por médico.
* Cálculo automático de "Por pagar" basado en el porcentaje acordado sobre la factura bruta.

### 4.8 Contabilidad e Inteligencia de Negocios (REFINADO)
Motor central que procesa la data administrativa para generar información financiera:
* **Generación de Asientos Automáticos:** Cada factura cerrada dispara un registro en la tabla `contabilidad_asientos`, gestionando cuentas de cobro, ingresos, costos de insumos y pasivos por comisión.
* **Reportes de Gestión (Exportables a PDF/Excel):**
    * **Estado de Resultados (P&L):** Ingresos totales menos costos de insumos y comisiones pagadas.
    * **Liquidación Detallada:** Reporte por médico con fechas, pacientes y monto neto a pagar.
    * **Kardex Valorado:** Historial de movimientos de cada insumo con valorización monetaria.
    * **Auditoría de Tasas:** Histórico de tasas manuales para re-expresar estados financieros pasados a valor USD actual.

---

## 5. Lógica de Interconexión (Core Engine)
Al procesar una factura, el sistema realiza este flujo ininterrumpido:
1.  **Inventario:** Descuenta automáticamente los insumos de la "receta" asociada.
2.  **Registro de Costo:** Calcula el costo de la venta ($cantidad\_insumo \times costo\_unitario$).
3.  **Registro de Pasivo:** Calcula la deuda con el médico ($monto\_servicio \times \%\_comision$).
4.  **Impacto Contable:** Guarda un asiento bimoneda único con referencia al ID de la factura.
5.  **Cierre de Caja:** El cajero declara el efectivo/transferencia; el sistema reporta desviaciones al Administrador.

---

## 6. Especificaciones Técnicas
* **Infraestructura:** Aplicación local de escritorio.
* **Persistencia:** SQLite (Esquema de datos extendido para contabilidad).
* **Monedas:**
    * **Funcional:** USD.
    * **Presentación/Legal:** VES (Bolívares).
* **Tasa de cambio:** Actualización manual diaria (almacenada en `historial_tasas`).
* **Respaldos:** Exportación de base de datos cifrada al cerrar la aplicación.

---

## 7. Diseño Visual del Dashboard (Centro de Mando)

### 7.1 Panel de Liquidez e Ingresos
* **KPI Primario:** Ganancia Neta del Día en USD ($Ventas - Costos - Comisiones$).
* **Comparativo:** Gráfica de barras volumen USD vs VES.
* **Semáforo de Caja:** Indicador visual de coincidencia en el cierre ciego.

### 7.2 Panel de Inventario
* **Stock Crítico:** Lista roja de insumos por debajo del mínimo.
* **Valor de Almacén:** Gráfica de torta con distribución del valor por categoría.

### 7.3 Panel de Rendimiento
* **Ranking Pareto:** Los 5 servicios que generan mayor utilidad neta real.
* **Productividad:** Gráfico comparativo de pacientes atendidos por médico.

---

## 8. Esquema de Datos Contable (Referencia de Desarrollo)
```sql
-- Tabla de Asientos Contables
CREATE TABLE contabilidad_asientos (
    id INTEGER PRIMARY KEY,
    fecha DATETIME,
    tasa_referencia DECIMAL,
    referencia_id INTEGER,
    debe_usd DECIMAL,
    haber_usd DECIMAL,
    debe_ves DECIMAL,
    haber_ves DECIMAL
);

-- Tabla de Historial de Tasas
CREATE TABLE historial_tasas (
    fecha DATE PRIMARY KEY,
    valor_bcv DECIMAL
);

-- Vista de Rentabilidad
-- Cruce automático entre facturación, recetas y comisiones.