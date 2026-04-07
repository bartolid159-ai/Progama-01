# Tarea 05: Plan de Implementación — Módulo de Servicios e Insumos Asociados

## Contexto y Objetivo

El módulo de Servicios es el **núcleo de la facturación**. Un servicio tiene precio, puede tener IVA (16%) o ser exento, está asociado a un médico por defecto, y consume insumos automáticamente al ser ejecutado (receta técnica). Este módulo conecta las entidades `medicos` e `insumos` que ya existen en el schema, y sienta la base para la Tarea 06 (Facturación).

---

## Base Existente (Ya Implementado)

| Elemento | Estado | Ubicación |
|---|---|---|
| Tabla `servicios` | ✅ Existe | `src/db/schema.sql` líneas 46-53 |
| Tabla `servicio_insumos` | ✅ Existe | `src/db/schema.sql` líneas 55-63 |
| Tabla `insumos` | ✅ Existe | `src/db/schema.sql` líneas 36-43 |
| DB Manager (Singleton) | ✅ Existe | `src/db/manager.js` |
| Patrón Browser/Node (dual-env) | ✅ Establecido | `doctorService.js`, `patientService.js` |
| App.jsx con routing de vistas | ✅ Existe | `src/App.jsx` |
| CSS y sistema de diseño | ✅ Existe | `src/index.css` |

> [!IMPORTANT]
> La tabla `insumos` NO tiene CRUD todavía en `manager.js`. Para que el formulario de servicios pueda mostrar una lista de insumos disponibles para seleccionar, **debemos primero agregar los helpers de insumos al manager**. Esto es un prerequisito bloqueante.

---

## Propuesta de Cambios

La implementación sigue el **mismo patrón de 3 capas** establecido en las tareas anteriores, respetando la arquitectura dual Browser/Node.

---

### Capa 1 — Base de Datos (`src/db/manager.js`)

#### [MODIFY] `src/db/manager.js`

Agregaremos al final del archivo los **helpers CRUD para `insumos` y `servicios`**, y la gestión de la tabla pivote `servicio_insumos`.

**Funciones a añadir:**

- `insertServicio(data)` — Recibe `{ nombre, precio_usd, es_exento, id_medico_defecto }`, inserta en `servicios`.
- `updateServicio(data)` — Actualiza un servicio por `id`.
- `deleteServicio(id)` — Borrado físico (los servicios no tienen `activo`).
- `getAllServicios()` — Trae todos los servicios con JOIN a médico (nombre del médico).
- `getServicioById(id)` — Para edición, trae el servicio con sus insumos asociados.
- `insertInsumo(data)` — CRUD básico de insumos (prerrequisito).
- `getAllInsumos()` — Lista todos los insumos disponibles.
- `setServicioInsumos(id_servicio, insumos[])` — **Transacción atómica**: borra todas las filas de `servicio_insumos` para ese servicio y re-inserta la lista nueva. Garantiza consistencia.

---

### Capa 2 — Lógica de Negocio

#### [NEW] `src/logic/serviceLogic.js`

Este es el archivo principal de la tarea. Sigue el **exacto mismo patrón** que `doctorService.js`:

```
- isBrowser / setBrowserMode
- getDbManager (importación dinámica con @vite-ignore)
- localStorage como backend de browser (STORAGE_KEY = 'clinica_services_db')
- localStorage separado para insumos (STORAGE_KEY_INSUMOS = 'clinica_insumos_db')
```

**Funciones exportadas:**

| Función | Descripción |
|---|---|
| `registerService(data)` | Valida, crea servicio + guarda relación insumos en transacción |
| `updateService(data)` | Actualiza campos del servicio + recalcula insumos asociados |
| `deleteService(id)` | Elimina el servicio (y sus relaciones en `servicio_insumos`) |
| `getServices()` | Devuelve todos los servicios con nombre del médico |
| `getServiceById(id)` | Devuelve un servicio con su lista de insumos (para pre-llenar el form de edición) |
| `getInsumos()` | Devuelve catálogo de insumos disponibles (para el selector del formulario) |
| `registerInsumo(data)` | Crea un insumo nuevo (campo auxiliar del formulario) |

**Datos iniciales en browser (seed):**
```js
// clinica_insumos_db
[
  { id: 1, nombre: 'Guantes de Látex', unidad_medida: 'Par', stock_actual: 200, costo_unitario_usd: 0.50 },
  { id: 2, nombre: 'Jeringa 5ml', unidad_medida: 'Unidad', stock_actual: 150, costo_unitario_usd: 0.30 },
  { id: 3, nombre: 'Alcohol 70%', unidad_medida: 'ml', stock_actual: 5000, costo_unitario_usd: 0.02 },
]

// clinica_services_db (incluye insumos asociados embebidos)
[
  { id: 1, nombre: 'Consulta General', precio_usd: 30, es_exento: true, id_medico_defecto: 1, medico_nombre: 'Dr. Gregory House', insumos: [{ id_insumo: 1, cantidad: 2 }] },
  { id: 2, nombre: 'Electrocardiograma', precio_usd: 50, es_exento: false, id_medico_defecto: 2, medico_nombre: 'Dra. Allison Cameron', insumos: [{ id_insumo: 1, cantidad: 1 }, { id_insumo: 2, cantidad: 3 }] },
]
```

---

### Capa 3 — Componentes UI

#### [NEW] `src/components/Services/ServiceList.jsx`

Análogo a `DoctorList.jsx`. Mostrará una tabla con:
- Nombre del servicio
- Precio (USD)
- Badge "Exento" / "IVA 16%" con color diferenciado
- Médico por defecto asociado
- Insumos (conteo de insumos vinculados: "3 insumos")
- Acciones: Editar / Eliminar

Recibe props: `onAddClick`, `onEditClick`.

#### [NEW] `src/components/Services/ServiceForm.jsx`

El formulario más complejo hasta ahora. Tendrá **tres secciones**:

**Sección 1 — Datos del Servicio:**
- `nombre` (text, requerido)
- `precio_usd` (number, requerido)
- `es_exento` (toggle/checkbox: "Exento de IVA" vs "IVA 16%")
- `id_medico_defecto` (select desplegable, cargado desde `getDoctors()`)

**Sección 2 — Receta de Insumos (Relación N:M):**
- Lista dinámica de insumos ya añadidos (con cantidad editable y botón de quitar)
- Selector para añadir un nuevo insumo (select de `getInsumos()` + input cantidad)
- Botón "➕ Añadir Insumo" para agregar a la lista local del form

**Sección 3 — Acciones:**
- Cancelar / Guardar Servicio

**Estado local del componente:**
```js
const [formData, setFormData] = useState({ nombre, precio_usd, es_exento: true, id_medico_defecto: '' });
const [insumosList, setInsumosList] = useState([]); // [{ id_insumo, nombre, cantidad }]
const [availableDoctors, setAvailableDoctors] = useState([]);
const [availableInsumos, setAvailableInsumos] = useState([]);
const [selectedInsumoId, setSelectedInsumoId] = useState('');
const [selectedInsumoQty, setSelectedInsumoQty] = useState(1);
```

---

### Capa 4 — Routing y Navegación (`src/App.jsx`)

#### [MODIFY] `src/App.jsx`

Cambios mínimos, siguiendo el patrón exacto de patients y doctors:

1. **Imports:** Añadir `ServiceList` y `ServiceForm`.
2. **Estado:** `showServiceForm`, `editingService`.
3. **Handlers:** `handleSaveService`, `handleEditService`.
4. **`getPageTitle()`:** Añadir case `'services'`.
5. **Nav sidebar:** Convertir el `<li>` de "Inventario" en un enlace activo como `'services'`.
6. **JSX:** Renderizar `<ServiceList>` y `<ServiceForm>` con sus props.

> [!NOTE]
> El item del sidebar se llamará "Servicios" en el nav. "Inventario" se activará en la Tarea de Insumos pura.

---

### Capa 5 — Tests Unitarios

#### [NEW] `src/logic/serviceLogic.test.js`

Siguiendo el patrón de los tests existentes. Cubrirá:

| Test | Descripción |
|---|---|
| `registerService — éxito` | Crea servicio con insumos y retorna `{ success: true }` |
| `registerService — validación` | Retorna error si falta `nombre` o `precio_usd` |
| `updateService — éxito` | Actualiza datos y recalcula insumos |
| `deleteService — éxito` | Elimina el servicio y sus relaciones |
| `getServices — retorna lista` | Lista no vacía con campos correctos |
| `getInsumos — retorna catálogo` | Lista de insumos disponibles |

---

## Orden de Ejecución (Secuencia de Implementación)

```
[1. manager.js] → [2. serviceLogic.js] → [3. ServiceList.jsx]
                                       ↘ [4. ServiceForm.jsx]
                                                  ↓
                                          [5. App.jsx]
                                                  ↓
                                   [6. serviceLogic.test.js]
                                                  ↓
                                     ✅ Criterios de Éxito
```

---

## Criterios de Éxito (de la Tarea 05)

- [ ] Al crear un servicio, se puede elegir un médico y una lista de insumos → `ServiceForm.jsx` con selects.
- [ ] El sistema guarda la relación en `servicio_insumos` → `setServicioInsumos()` transaccional en `manager.js` + array embebido en browser.
- [ ] Flag de IVA exento/16% configurable por servicio → campo `es_exento` con toggle visual.
- [ ] Tests unitarios pasan con `vitest run`.

---

## Preguntas Abiertas

> [!IMPORTANT]
> **¿Crear insumos desde el formulario de servicio?** — La propuesta es que el formulario solo *seleccione* insumos ya existentes del catálogo. Si se necesitan crear insumos on-the-fly, requeriría un mini-modal adicional.

> [!NOTE]
> **Eliminación de servicios:** Para esta tarea se propone **borrado físico simple** (aún no hay facturas). En la Tarea de Facturación se añadirá la validación de integridad referencial.

---

## Plan de Verificación

### Tests Automatizados
```bash
npx vitest run src/logic/serviceLogic.test.js
```

### Verificación Manual en Browser
1. Navegar a "Servicios" en la barra lateral.
2. Crear un servicio ("Consulta Cardiológica", $45, IVA 16%, médico: Dr. House, 2 guantes + 1 jeringa).
3. Verificar que aparece en la lista con badge "IVA 16%".
4. Editar el servicio, cambiar precio a $50 y remover un insumo.
5. Verificar que los cambios persisten al recargar la página (localStorage).
6. Eliminar el servicio y verificar que desaparece de la lista.
