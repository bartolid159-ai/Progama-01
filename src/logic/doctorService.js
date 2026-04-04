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
    // We use a variable path and @vite-ignore to prevent Vite from bundling 
    // Node-specific modules (better-sqlite3) during web dev/build.
    const dbPath = '../db/manager.js';
    dbManager = await import(/* @vite-ignore */ dbPath);
  }
  return dbManager;
};

// Browser persistence helper
const STORAGE_KEY = 'clinica_doctors_db';
const getBrowserDoctors = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        const initial = [
            { id: 1, nombre: 'Dr. Gregory House', cedula_rif: 'V-12345', telefono: '0412-5551234', correo: 'house@princeton.com', especialidad: 'Diagnóstico', porcentaje_comision: 30, activo: 1 },
            { id: 2, nombre: 'Dra. Allison Cameron', cedula_rif: 'V-67890', telefono: '0424-5556789', correo: 'cameron@princeton.com', especialidad: 'Inmunología', porcentaje_comision: 25, activo: 1 }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    const parsed = JSON.parse(data);
    // Ensure IDs are numbers
    return parsed.map(d => ({ ...d, id: Number(d.id) }));
};
const saveBrowserDoctors = (doctors) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
    console.log("DB Local Actualizada (localStorage):");
    console.table(doctors.filter(d => d.activo === 1));
};

/**
 * Adds a new doctor after validation.
 */
const registerDoctor = async (doctorData) => {
  try {
    const requiredFields = ['nombre', 'especialidad', 'porcentaje_comision'];
    for (const field of requiredFields) {
      if (doctorData[field] === undefined || doctorData[field] === '') {
        return { success: false, message: `El campo ${field} es obligatorio.` };
      }
    }

    if (isBrowser) {
      const doctors = getBrowserDoctors();
      const newDoctor = { 
        ...doctorData, 
        id: Date.now(), 
        activo: 1,
        porcentaje_comision: Number(doctorData.porcentaje_comision) 
      };
      doctors.push(newDoctor);
      saveBrowserDoctors(doctors);
      return { success: true, message: "Médico registrado exitosamente (Modo Navegador)." };
    }

    const db = await getDbManager();
    const result = db.insertMedico(doctorData);
    return { success: true, message: "Médico guardado exitosamente.", id: result.lastInsertRowid };
  } catch (error) {
    console.error("Error in registerDoctor:", error);
    return { success: false, message: "Error interno al guardar el médico." };
  }
};

/**
 * Updates an existing doctor.
 */
export const updateDoctor = async (doctorData) => {
  try {
    if (!doctorData.id) {
        return { success: false, message: `El ID es obligatorio para actualizar.` };
    }

    if (isBrowser) {
      const doctors = getBrowserDoctors();
      const numericId = Number(doctorData.id);
      const index = doctors.findIndex(d => d.id === numericId);
      if (index !== -1) {
          doctors[index] = { 
            ...doctors[index], 
            ...doctorData, 
            id: numericId // Ensure it stays a number
          };
          saveBrowserDoctors(doctors);
          return { success: true, message: "Médico actualizado exitosamente (Modo Navegador)." };
      }
      return { success: false, message: "Médico no encontrado." };
    }

    const db = await getDbManager();
    db.updateMedico(doctorData);
    return { success: true, message: "Médico actualizado exitosamente." };
  } catch (error) {
    console.error("Error in updateDoctor:", error);
    return { success: false, message: "Error interno al actualizar el médico." };
  }
};

/**
 * Deactivates (soft deletes) an existing doctor.
 */
export const deleteDoctor = async (id) => {
  try {
    const numericId = Number(id);
    if (isBrowser) {
      const doctors = getBrowserDoctors();
      const index = doctors.findIndex(d => d.id === numericId);
      if (index !== -1) {
          doctors[index].activo = 0; // Soft delete
          saveBrowserDoctors(doctors);
          return { success: true, message: "Médico eliminado exitosamente (Modo Navegador)." };
      }
      return { success: false, message: "Médico no encontrado." };
    }

    const db = await getDbManager();
    db.deactivateMedico(numericId);
    return { success: true, message: "Médico eliminado exitosamente." };
  } catch (error) {
    console.error("Error in deleteDoctor:", error);
    return { success: false, message: "Error interno al eliminar el médico." };
  }
};

/**
 * Searches for doctors by name.
 */
export const searchDoctors = async (query) => {
  if (isBrowser) {
    const doctors = getBrowserDoctors().filter(d => d.activo === 1);
    if (!query) return doctors;
    const lowerQuery = query.toLowerCase();
    return doctors.filter(d => 
      d.nombre.toLowerCase().includes(lowerQuery) ||
      (d.cedula_rif && d.cedula_rif.toLowerCase().includes(lowerQuery)) ||
      d.especialidad.toLowerCase().includes(lowerQuery)
    );
  }
  const db = await getDbManager();
  return db.searchMedicos(query);
};

/**
 * Gets all active doctors.
 */
export const getDoctors = async () => {
  if (isBrowser) {
    return getBrowserDoctors().filter(d => d.activo === 1);
  }
  const db = await getDbManager();
  return db.getAllMedicos();
};

export { registerDoctor };
