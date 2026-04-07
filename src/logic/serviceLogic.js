// Import type:module requires dynamic imports to avoid bundling Node modules in browser
let dbManager = null;

// Determine environment
let isBrowser = typeof window !== 'undefined' && 
                  typeof window.document !== 'undefined' && 
                  process.env.NODE_ENV !== 'test';

export const setBrowserMode = (mode) => { isBrowser = mode; };

/**
 * Helper to get the database manager dynamically only in native/test environment.
 */
const getDbManager = async () => {
  if (isBrowser) return null;
  if (!dbManager) {
    const dbPath = '../db/manager.js';
    dbManager = await import(/* @vite-ignore */ dbPath);
  }
  return dbManager;
};

// Browser persistence helpers
const SERVICES_KEY = 'clinica_services_db';
const INSUMOS_KEY = 'clinica_insumos_db';

const getBrowserInsumos = () => {
    const data = localStorage.getItem(INSUMOS_KEY);
    if (!data) {
        const initial = [
            { id: 1, nombre: 'Guantes de Látex', unidad_medida: 'Par', stock_actual: 200, costo_unitario_usd: 0.50 },
            { id: 2, nombre: 'Jeringa 5ml', unidad_medida: 'Unidad', stock_actual: 150, costo_unitario_usd: 0.30 },
            { id: 3, nombre: 'Alcohol 70%', unidad_medida: 'ml', stock_actual: 5000, costo_unitario_usd: 0.02 }
        ];
        localStorage.setItem(INSUMOS_KEY, JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(data).map(i => ({ ...i, id: Number(i.id) }));
};

const getBrowserServices = () => {
    const data = localStorage.getItem(SERVICES_KEY);
    if (!data) {
        const initial = [
            { id: 1, nombre: 'Consulta General', precio_usd: 30, es_exento: true, id_medico_defecto: 1, medico_nombre: 'Dr. Gregory House', insumos: [{ id_insumo: 1, cantidad: 2 }] },
            { id: 2, nombre: 'Electrocardiograma', precio_usd: 50, es_exento: false, id_medico_defecto: 2, medico_nombre: 'Dra. Allison Cameron', insumos: [{ id_insumo: 1, cantidad: 1 }, { id_insumo: 2, cantidad: 3 }] }
        ];
        localStorage.setItem(SERVICES_KEY, JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(data).map(s => ({ ...s, id: Number(s.id) }));
};

const saveBrowserServices = (services) => {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
};

const saveBrowserInsumos = (insumos) => {
    localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
};

/**
 * Register a new service.
 */
export const registerService = async (serviceData, insumos = []) => {
    try {
        if (!serviceData.nombre || !serviceData.precio_usd) {
            return { success: false, message: "Nombre y precio son obligatorios." };
        }

        if (isBrowser) {
            const services = getBrowserServices();
            const newService = {
                ...serviceData,
                id: Date.now(),
                insumos: insumos.map(i => ({ ...i, id_insumo: Number(i.id_insumo), cantidad: Number(i.cantidad) }))
            };
            services.push(newService);
            saveBrowserServices(services);
            return { success: true, message: "Servicio registrado exitosamente (Navegador)." };
        }

        const db = await getDbManager();
        const result = db.insertServicio(serviceData);
        const serviceId = result.lastInsertRowid;
        
        if (insumos.length > 0) {
            db.setServicioInsumos(serviceId, insumos);
        }
        
        return { success: true, message: "Servicio guardado exitosamente.", id: serviceId };
    } catch (error) {
        console.error("Error in registerService:", error);
        return { success: false, message: "Error al registrar el servicio." };
    }
};

/**
 * Update an existing service.
 */
export const updateService = async (serviceData, insumos = []) => {
    try {
        if (!serviceData.id) return { success: false, message: "ID obligatorio." };

        if (isBrowser) {
            const services = getBrowserServices();
            const index = services.findIndex(s => s.id === Number(serviceData.id));
            if (index !== -1) {
                services[index] = {
                    ...services[index],
                    ...serviceData,
                    insumos: insumos.map(i => ({ ...i, id_insumo: Number(i.id_insumo), cantidad: Number(i.cantidad) }))
                };
                saveBrowserServices(services);
                return { success: true, message: "Servicio actualizado (Navegador)." };
            }
            return { success: false, message: "Servicio no encontrado." };
        }

        const db = await getDbManager();
        db.updateServicio(serviceData);
        db.setServicioInsumos(serviceData.id, insumos);
        return { success: true, message: "Servicio actualizado exitosamente." };
    } catch (error) {
        console.error("Error in updateService:", error);
        return { success: false, message: "Error al actualizar el servicio." };
    }
};

/**
 * Delete a service.
 */
export const deleteService = async (id) => {
    try {
        const numericId = Number(id);
        if (isNaN(numericId)) return { success: false, message: "ID de servicio inválido." };

        if (isBrowser) {
            const services = getBrowserServices();
            const filtered = services.filter(s => Number(s.id) !== numericId);
            saveBrowserServices(filtered);
            console.log(`Servicio ${numericId} eliminado de local.`);
            return { success: true, message: "Servicio eliminado exitosamente (Navegador)." };
        }

        const db = await getDbManager();
        db.deleteServicio(numericId);
        return { success: true, message: "Servicio eliminado exitosamente." };
    } catch (error) {
        console.error("Error in deleteService:", error);
        return { success: false, message: "Error al eliminar el servicio." };
    }
};

/**
 * Get all services.
 */
export const getServices = async () => {
    if (isBrowser) return getBrowserServices();
    const db = await getDbManager();
    return db.getAllServicios();
};

/**
 * Get all insumos.
 */
export const getInsumos = async () => {
    if (isBrowser) return getBrowserInsumos();
    const db = await getDbManager();
    return db.getAllInsumos();
};

/**
 * Get insumos by service ID.
 */
export const getInsumosByServicio = async (id_servicio) => {
    if (isBrowser) {
        const services = getBrowserServices();
        const service = services.find(s => s.id === Number(id_servicio));
        return service?.insumos || [];
    }
    const db = await getDbManager();
    return db.getInsumosByServicio(id_servicio);
};

/**
 * Register a new insumo.
 */
export const registerInsumo = async (insumoData) => {
    if (isBrowser) {
        const insumos = getBrowserInsumos();
        insumos.push({ ...insumoData, id: Date.now() });
        saveBrowserInsumos(insumos);
        return { success: true, message: "Insumo registrado (Navegador)." };
    }
    const db = await getDbManager();
    const result = db.insertInsumo(insumoData);
    return { success: true, message: "Insumo registrado.", id: result.lastInsertRowid };
};
