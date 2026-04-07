import * as dbManager from '../db/manager.js';

// Determine environment
let isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const setBrowserMode = (mode) => { isBrowser = mode; };

/**
 * Helper to get the database manager.
 */
const getDbManager = () => {
  if (isBrowser) return null;
  return dbManager;
};

/**
 * Local storage keys
 */
const SERVICES_KEY = 'clinica_servicios';
const INSUMOS_KEY = 'clinica_insumos';

// Browser fallback logic
const getBrowserServices = () => JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]');
const saveBrowserServices = (services) => localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
const getBrowserInsumos = () => JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
const saveBrowserInsumos = (insumos) => localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));

/**
 * Register a new service.
 */
export const registerService = async (serviceData) => {
    try {
        // Validation
        if (!serviceData.nombre || serviceData.precio_usd === undefined || serviceData.precio_usd === null) {
            return { success: false, message: "Nombre y precio son obligatorios." };
        }
        if (serviceData.precio_usd < 0) {
            return { success: false, message: "El precio no puede ser negativo." };
        }

        const insumos = serviceData.insumos || [];

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

        const db = getDbManager();
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
export const updateService = async (serviceData) => {
    try {
        if (!serviceData.id) return { success: false, message: "ID obligatorio." };
        
        // Validation
        if (!serviceData.nombre || serviceData.precio_usd === undefined) {
             return { success: false, message: "Nombre y precio son obligatorios." };
        }
        if (serviceData.precio_usd < 0) {
            return { success: false, message: "El precio no puede ser negativo." };
        }

        const insumos = serviceData.insumos || [];

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

        const db = getDbManager();
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
            const services = getBrowserServices().filter(s => s.id !== numericId);
            saveBrowserServices(services);
            return { success: true, message: "Servicio eliminado exitosamente (Navegador)." };
        }

        const db = getDbManager();
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
    const db = getDbManager();
    const services = db.getAllServicios();
    
    // Aggregate insumos for each service
    return services.map(service => ({
        ...service,
        insumos: db.getInsumosByServicio(service.id)
    }));
};

/**
 * Get all available insumos.
 */
export const getInsumos = async () => {
    if (isBrowser) return getBrowserInsumos();
    const db = getDbManager();
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
    const db = getDbManager();
    return db.getInsumosByServicio(id_servicio);
};

/**
 * Register a new insumo.
 */
export const registerInsumo = async (insumoData) => {
    if (isBrowser) {
        const insumos = getBrowserInsumos();
        insumoData.id = Date.now();
        insumos.push(insumoData);
        saveBrowserInsumos(insumos);
        return { success: true, message: "Insumo registrado (Navegador)." };
    }
    const db = getDbManager();
    const result = db.insertInsumo(insumoData);
    return { success: true, message: "Insumo registrado.", id: result.lastInsertRowid };
};
